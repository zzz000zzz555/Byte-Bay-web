from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from copy import deepcopy

SOURCE = r'D:\PROYECTO DE COMERSIO ELECTRONICO\Beru\output\word\PROYECTO GUIA\DOCUMENTACION DE BYTE BAY.docx'
OUTPUT = SOURCE

doc = Document(SOURCE)

def remove_body_content(document):
    body = document._element.body
    sectPr = body.sectPr
    for child in list(body):
        if child is not sectPr:
            body.remove(child)

def set_font(run, size=None, bold=None, color=None):
    run.font.name = 'Arial'
    run._element.rPr.rFonts.set(qn('w:ascii'), 'Arial')
    run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial')
    if size: run.font.size = Pt(size)
    if bold is not None: run.bold = bold
    if color: run.font.color.rgb = RGBColor(*color)

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

def cell_border(cell, color='D9D9D9'):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge in ('top','left','bottom','right'):
        tag = OxmlElement(f'w:{edge}')
        tag.set(qn('w:val'),'single'); tag.set(qn('w:sz'),'6'); tag.set(qn('w:color'),color)
        borders.append(tag)
    tcPr.append(borders)

def paragraph(text='', style=None, bold_lead=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(9)
    p.paragraph_format.line_spacing = 1.25
    if bold_lead and text.startswith(bold_lead):
        r=p.add_run(bold_lead); set_font(r, 11, True)
        r=p.add_run(text[len(bold_lead):]); set_font(r,11)
    else:
        r=p.add_run(text); set_font(r,11)
    return p

def heading(text, level=1):
    p=doc.add_paragraph(style=f'Heading {level}')
    p.paragraph_format.space_before=Pt(16 if level==1 else 10)
    p.paragraph_format.space_after=Pt(8)
    p.paragraph_format.keep_with_next=True
    r=p.add_run(text); set_font(r, 15 if level==1 else 12, True, (0,0,0))
    return p

def bullet(text):
    p=doc.add_paragraph()
    p.paragraph_format.left_indent=Inches(0.25)
    p.paragraph_format.first_line_indent=Inches(-0.15)
    p.paragraph_format.space_after=Pt(4)
    r=p.add_run('• '); set_font(r,11,True)
    r=p.add_run(text); set_font(r,11)
    return p

def page_break(): doc.add_page_break()

remove_body_content(doc)

# Base document settings
section=doc.sections[0]
section.top_margin=Inches(0.9); section.bottom_margin=Inches(0.9)
section.left_margin=Inches(1.0); section.right_margin=Inches(1.0)
for style_name in ['Normal','Heading 1','Heading 2']:
    style=doc.styles[style_name]
    style.font.name='Arial'
    style._element.rPr.rFonts.set(qn('w:ascii'),'Arial')
    style._element.rPr.rFonts.set(qn('w:hAnsi'),'Arial')

# Cover
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(130)
r=p.add_run('DOCUMENTACIÓN DE BYTE BAY'); set_font(r,24,True,(0,0,0))
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(18)
r=p.add_run('Proyecto de comercio electrónico'); set_font(r,15,False,(0,0,0))
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(110)
r=p.add_run('Compra y vende fácil'); set_font(r,13,True,(0,0,0))
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(14)
r=p.add_run('2026'); set_font(r,11,False,(0,0,0))
page_break()

# Index
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(24); p.paragraph_format.space_after=Pt(24)
r=p.add_run('ÍNDICE'); set_font(r,17,True,(0,0,0))
index_items=['Introducción','Presentación de Byte Bay','Quiénes somos','Misión y visión','Objetivos del negocio','Buyer persona','Propuesta de valor','Canvas Business Model']
for i,item in enumerate(index_items,1):
    p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(8)
    r=p.add_run(f'{i}. {item}'); set_font(r,12,False,(0,0,0))
page_break()

# Content
heading('INTRODUCCIÓN',1)
paragraph('El comercio electrónico permite que las personas consulten productos y realicen compras desde cualquier dispositivo. Sin embargo, una tienda digital necesita mostrar información clara sobre precios, disponibilidad y características para que el usuario pueda decidir con seguridad.')
paragraph('Byte Bay es una propuesta de comercio electrónico que organiza productos de distintas categorías en una sola página web. El proyecto incorpora catálogo, filtros de búsqueda, carrito de compra, ofertas, recomendaciones con consentimiento del usuario y un panel interno para administrar productos e inventario.')
paragraph('Este documento presenta la idea de negocio de Byte Bay, su público objetivo, la propuesta de valor y el modelo de negocio inicial que orienta su desarrollo.')

heading('PRESENTACIÓN DE BYTE BAY',1)
paragraph('Byte Bay es una plataforma web de comercio electrónico orientada a facilitar la búsqueda y compra de productos de uso cotidiano. La página reúne categorías como tecnología, hogar, supermercado, moda, deportes y belleza.')
paragraph('La solución se diseñó con una interfaz adaptable para celulares, tablets y computadoras. El usuario puede filtrar por categoría y precio, revisar el detalle de cada producto, agregar artículos al carrito y registrar su pedido. La administración interna permite mantener actualizado el catálogo, el stock y las ofertas.')

heading('QUIÉNES SOMOS',1)
paragraph('Somos un equipo que desarrolla Byte Bay como una alternativa digital para acercar productos y ofertas a los usuarios mediante una experiencia simple de navegación. Buscamos que las personas encuentren información útil antes de comprar y que el equipo responsable pueda administrar el catálogo desde un panel interno.')
paragraph('Byte Bay nace como un proyecto nuevo. Por esa razón, priorizamos una plataforma ordenada, una comunicación transparente y mejoras progresivas basadas en el uso de la página.')

heading('MISIÓN Y VISIÓN',1)
heading('Misión',2)
paragraph('Facilitar compras digitales confiables mediante una plataforma que permita encontrar productos, comparar opciones y realizar pedidos con información clara sobre precio, disponibilidad y ofertas.')
heading('Visión',2)
paragraph('Convertir a Byte Bay en una alternativa reconocida de comercio electrónico, con un catálogo cada vez más amplio y una experiencia que genere confianza en los usuarios.')

heading('OBJETIVOS DEL NEGOCIO',1)
heading('Objetivo general',2)
paragraph('Desarrollar y consolidar una plataforma de comercio electrónico que conecte a los usuarios con un catálogo variado, facilite la compra digital y permita una gestión ordenada de productos, inventario y ofertas.')
heading('Objetivos específicos',2)
bullet('Ofrecer una navegación clara con búsqueda, filtros por categoría y orden de precio.')
bullet('Mantener visibles el precio, el stock y las ofertas activas de cada producto.')
bullet('Mejorar la experiencia de compra mediante carrito, detalle de producto y registro de pedidos.')
bullet('Incorporar recomendaciones respetando la decisión del usuario sobre la personalización.')
bullet('Promover el crecimiento de la marca mediante catálogo actualizado, redes sociales y atención al cliente.')

heading('BUYER PERSONA',1)
paragraph('El buyer persona principal de Byte Bay representa a una persona que compra en línea desde su celular y busca resolver compras cotidianas sin recorrer varias páginas.')
table=doc.add_table(rows=0, cols=2); table.alignment=WD_TABLE_ALIGNMENT.CENTER
rows=[('Nombre representativo','Valeria, compradora digital'),('Edad y contexto','Entre 18 y 35 años. Estudia, trabaja o combina ambas actividades y usa el celular para informarse y comprar.'),('Necesidad','Encontrar productos disponibles, conocer el precio y decidir rápido.'),('Comportamiento','Compara opciones, revisa ofertas, busca información clara y valora una página fácil de usar.'),('Motivación','Ahorrar tiempo, acceder a promociones reales y comprar desde un mismo lugar.'),('Frustraciones','Productos sin stock, precios confusos, páginas lentas y procesos de compra poco claros.')]
for a,b in rows:
    cells=table.add_row().cells
    for cell in cells:
        cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; cell_border(cell)
        for p in cell.paragraphs: p.paragraph_format.space_after=Pt(4); p.paragraph_format.space_before=Pt(4)
    shade(cells[0],'EAF2F0')
    r=cells[0].paragraphs[0].add_run(a); set_font(r,10,True)
    r=cells[1].paragraphs[0].add_run(b); set_font(r,10,False)

heading('PROPUESTA DE VALOR',1)
paragraph('Byte Bay propone una experiencia de compra digital que reúne variedad de productos, información visible y herramientas de búsqueda en un mismo lugar. El usuario puede revisar categorías, filtrar resultados, identificar ofertas reales y conocer la disponibilidad antes de añadir un producto al carrito.')
paragraph('La propuesta también incorpora una administración interna del catálogo y del inventario. Esto ayuda a que el equipo mantenga actualizados los productos y reduzca la posibilidad de mostrar información desactualizada. Las recomendaciones se activan solo cuando el usuario acepta la personalización.')

heading('CANVAS BUSINESS MODEL',1)
paragraph('El siguiente Canvas resume el modelo de negocio propuesto para la etapa inicial de Byte Bay.')
canvas=doc.add_table(rows=3, cols=3); canvas.alignment=WD_TABLE_ALIGNMENT.CENTER
canvas_data=[
    ('Socios clave','Proveedores de productos, servicios de pago, Supabase y servicios de alojamiento web.','Actividades clave','Actualizar catálogo, controlar stock, gestionar ofertas y atender pedidos.','Propuesta de valor','Catálogo variado con búsqueda, filtros, precios, stock y ofertas visibles.','Relación con clientes','Atención por la página, cuentas de usuario, notificaciones y recomendaciones con consentimiento.'),
    ('Recursos clave','Plataforma web, base de datos, catálogo, imágenes de productos y equipo de administración.','Canales','Página web, inicio de sesión con Google y difusión futura en redes sociales.','Segmentos de clientes','Personas que compran en línea desde el celular o computadora y buscan productos de uso cotidiano.','',''),
    ('Estructura de costos','Desarrollo y mantenimiento web, alojamiento, base de datos, dominio, difusión y operación del catálogo.','Fuentes de ingresos','Ventas de productos publicados, promociones y posibles acuerdos comerciales con proveedores.','','','')
]
for r_i,row in enumerate(canvas_data):
    for c_i in range(3):
        cell=canvas.cell(r_i,c_i); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; cell_border(cell)
        values=row[c_i*2:c_i*2+2]
        if values[0]:
            shade(cell,'EAF2F0' if r_i%2==0 else 'F7F7F7')
            p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(4)
            run=p.add_run(values[0]); set_font(run,9,True)
            p=cell.add_paragraph(); p.paragraph_format.space_after=Pt(3)
            run=p.add_run(values[1]); set_font(run,8,False)

for p in doc.paragraphs:
    if p.style.name == 'Normal':
        p.paragraph_format.line_spacing=1.2

doc.save(OUTPUT)
print(OUTPUT)
