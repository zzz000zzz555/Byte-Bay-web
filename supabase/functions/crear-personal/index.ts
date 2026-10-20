import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const rolesValidos = ['jefe', 'empleado']
const texto = (valor: unknown) => typeof valor === 'string' ? valor.trim() : ''

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error('Sesión requerida')
    const url = Deno.env.get('SUPABASE_URL'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) throw new Error('La función no tiene configurado el acceso administrativo')
    const admin = createClient(url, serviceKey)
    const { data: caller, error: callerError } = await admin.auth.getUser(token)
    if (callerError || !caller.user) throw new Error('Sesión no válida')
    const { data: jefe } = await admin.from('personal').select('rol,activo').eq('id_usuario', caller.user.id).maybeSingle()
    if (!jefe?.activo || jefe.rol !== 'jefe') throw new Error('Solo el jefe puede gestionar el personal')

    const cuerpo = await request.json(), accion = texto(cuerpo.accion), idUsuario = texto(cuerpo.id_usuario)
    if (accion === 'listar') {
      const { data, error } = await admin.from('personal').select('id_usuario,nombres,apellidos,correo,rol,activo,creado_en,actualizado_en,anulado_en,motivo_anulacion').order('activo', { ascending: false }).order('nombres')
      if (error) throw error
      return Response.json({ personal: data ?? [] }, { headers: corsHeaders })
    }

    // Modo temporal sin servicio de correo: solo el jefe registra empleados.
    if (accion === 'registrar_empleado') {
      const nombres = texto(cuerpo.nombres), apellidos = texto(cuerpo.apellidos), correo = texto(cuerpo.correo).toLowerCase(), contrasena = texto(cuerpo.contrasena)
      if (!nombres || !apellidos || !correo || contrasena.length < 8) throw new Error('Completa los datos y usa una contraseña de al menos 8 caracteres')
      const { data: usuariosAuth, error: usuariosError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (usuariosError) throw usuariosError
      if (usuariosAuth.users.some(usuario => usuario.email?.toLowerCase() === correo)) throw new Error('Este correo ya está registrado en Supabase Auth')
      const { data: creado, error: crearError } = await admin.auth.admin.createUser({ email: correo, password: contrasena, email_confirm: true, user_metadata: { nombres, apellidos, rol: 'empleado' } })
      if (crearError || !creado.user) throw crearError || new Error('No se pudo crear la cuenta del empleado')
      const { error: perfilError } = await admin.from('personal').insert({ id_usuario: creado.user.id, nombres, apellidos, correo, rol: 'empleado', activo: true })
      if (perfilError) { await admin.auth.admin.deleteUser(creado.user.id); throw perfilError }
      await admin.from('auditoria_personal').insert({ id_usuario: caller.user.id, accion: 'registrar', entidad: 'personal', id_entidad: creado.user.id, detalle: { correo, rol: 'empleado' } })
      return Response.json({ id_usuario: creado.user.id, correo }, { headers: corsHeaders })
    }

    if (accion === 'invitar') {
      const nombres = texto(cuerpo.nombres), apellidos = texto(cuerpo.apellidos), correo = texto(cuerpo.correo).toLowerCase(), rol = texto(cuerpo.rol)
      if (!nombres || !apellidos || !correo || !rolesValidos.includes(rol)) throw new Error('Datos de personal no válidos')
      const origen = texto(cuerpo.url_redireccion)
      const redirectTo = /^https:\/\//.test(origen) || /^http:\/\/localhost(?::\d+)?\//.test(origen) ? origen : (Deno.env.get('SITE_URL') || 'http://localhost:5500/admin.html')
      const { data: usuariosAuth, error: usuariosError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (usuariosError) throw usuariosError
      const existente = usuariosAuth.users.find(usuario => usuario.email?.toLowerCase() === correo)
      let usuarioId: string
      let tipoCorreo: 'invitacion' | 'recuperacion'
      if (existente) {
        usuarioId = existente.id
        tipoCorreo = 'recuperacion'
        const { error: actualizarAuthError } = await admin.auth.admin.updateUserById(usuarioId, { data: { ...existente.user_metadata, nombres, apellidos, rol } })
        if (actualizarAuthError) throw actualizarAuthError
      } else {
        const { data: invitado, error: invitacionError } = await admin.auth.admin.inviteUserByEmail(correo, { redirectTo, data: { nombres, apellidos, rol } })
        if (invitacionError || !invitado.user) throw invitacionError || new Error('No se pudo enviar la invitación')
        usuarioId = invitado.user.id
        tipoCorreo = 'invitacion'
      }
      const { error: perfilError } = await admin.from('personal').upsert({ id_usuario: usuarioId, nombres, apellidos, correo, rol, activo: true, anulado_en: null, anulado_por: null, motivo_anulacion: null, actualizado_en: new Date().toISOString() })
      if (perfilError) throw perfilError
      if (tipoCorreo === 'recuperacion') {
        const { error: recuperacionError } = await admin.auth.resetPasswordForEmail(correo, { redirectTo })
        if (recuperacionError) throw recuperacionError
      }
      await admin.from('auditoria_personal').insert({ id_usuario: caller.user.id, accion: tipoCorreo === 'invitacion' ? 'invitar' : 'vincular', entidad: 'personal', id_entidad: usuarioId, detalle: { correo, rol } })
      return Response.json({ id_usuario: usuarioId, correo, rol, tipo_correo: tipoCorreo }, { headers: corsHeaders })
    }

    if (!idUsuario) throw new Error('Falta identificar al personal')
    if (idUsuario === caller.user.id && (accion === 'eliminar' || (accion === 'cambiar_estado' && cuerpo.activo === false))) throw new Error('No puedes anular ni eliminar tu propia cuenta')
    const { data: objetivo, error: objetivoError } = await admin.from('personal').select('id_usuario,rol,activo').eq('id_usuario', idUsuario).maybeSingle()
    if (objetivoError || !objetivo) throw new Error('Personal no encontrado')

    if (accion === 'actualizar') {
      const nombres = texto(cuerpo.nombres), apellidos = texto(cuerpo.apellidos)
      if (!nombres || !apellidos) throw new Error('Datos de personal no válidos')
      const { error } = await admin.from('personal').update({ nombres, apellidos, actualizado_en: new Date().toISOString() }).eq('id_usuario', idUsuario)
      if (error) throw error
      await admin.from('auditoria_personal').insert({ id_usuario: caller.user.id, accion: 'editar', entidad: 'personal', id_entidad: idUsuario, detalle: {} })
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (accion === 'cambiar_estado') {
      const activo = cuerpo.activo === true, motivo = texto(cuerpo.motivo_anulacion)
      if (!activo && !motivo) throw new Error('Indica el motivo de la anulación')
      const { error } = await admin.from('personal').update({ activo, actualizado_en: new Date().toISOString(), anulado_en: activo ? null : new Date().toISOString(), anulado_por: activo ? null : caller.user.id, motivo_anulacion: activo ? null : motivo }).eq('id_usuario', idUsuario)
      if (error) throw error
      const { error: authError } = await admin.auth.admin.updateUserById(idUsuario, { ban_duration: activo ? 'none' : '876000h' })
      if (authError) throw authError
      await admin.from('auditoria_personal').insert({ id_usuario: caller.user.id, accion: activo ? 'reactivar' : 'anular', entidad: 'personal', id_entidad: idUsuario, detalle: { motivo } })
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (accion === 'eliminar') {
      const { count } = await admin.from('personal').select('*', { count: 'exact', head: true }).eq('rol', 'jefe').eq('activo', true)
      if (objetivo.rol === 'jefe' && objetivo.activo && (count ?? 0) <= 1) throw new Error('Debe existir al menos un jefe activo')
      await admin.from('auditoria_personal').insert({ id_usuario: caller.user.id, accion: 'eliminar', entidad: 'personal', id_entidad: idUsuario, detalle: {} })
      const { error } = await admin.auth.admin.deleteUser(idUsuario)
      if (error) throw error
      return Response.json({ ok: true }, { headers: corsHeaders })
    }
    throw new Error('Acción no válida')
  } catch (error) {
    return Response.json({ error: error.message || 'Error inesperado' }, { status: 400, headers: corsHeaders })
  }
})
