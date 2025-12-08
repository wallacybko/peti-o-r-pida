import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  ImageRun,
  PageNumber,
  NumberFormat,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { Packer } from "docx";
import { PetitionData, PETITION_TYPE_LABELS, DEFAULT_OFFICE } from "@/types/petition";
import { formatCurrency, formatCurrencyExtended, formatDateShort, formatDate } from "@/utils/formatters";

const FONT_FAMILY = "Arial";
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_SMALL = 20; // 10pt
const FONT_SIZE_HEADER = 20; // 10pt

function createTextRun(text: string, options?: { bold?: boolean; size?: number; italics?: boolean }) {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: options?.size || FONT_SIZE_NORMAL,
    bold: options?.bold,
    italics: options?.italics,
  });
}

function createParagraph(
  children: TextRun[],
  options?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { after?: number; before?: number }; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] }
) {
  return new Paragraph({
    children,
    alignment: options?.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: options?.spacing?.after ?? 200, before: options?.spacing?.before ?? 0 },
    heading: options?.heading,
  });
}

async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  const base64Data = base64.split(",")[1] || base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function exportToWord(data: PetitionData): Promise<void> {
  const { client, bank, charges, moralDamage, wastedTimeDamage, chargeDescription, petitionType } = data;
  const office = DEFAULT_OFFICE;

  const totalCharges = charges.reduce((sum, c) => sum + c.value, 0);
  const materialDamage = totalCharges * 2;
  const totalIndenization = moralDamage + wastedTimeDamage;
  const totalValue = materialDamage + totalIndenization;
  const chargeLabel = chargeDescription || PETITION_TYPE_LABELS[petitionType];

  // Create header
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          createTextRun(office.name, { bold: true, size: 28 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          createTextRun(`${office.address} - CEP: ${office.cep}`, { size: FONT_SIZE_HEADER }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          createTextRun(`${office.city}/${office.state} | ${office.phone} | ${office.email}`, { size: FONT_SIZE_HEADER }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: { color: "1e3a5f", style: BorderStyle.SINGLE, size: 12 },
        },
        spacing: { after: 400 },
        children: [],
      }),
    ],
  });

  // Create footer
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { color: "1e3a5f", style: BorderStyle.SINGLE, size: 12 },
        },
        spacing: { before: 200 },
        children: [
          createTextRun(`${office.name} - `, { size: FONT_SIZE_SMALL, bold: true }),
          createTextRun(office.website, { size: FONT_SIZE_SMALL }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          createTextRun("Página ", { size: FONT_SIZE_SMALL }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT_FAMILY,
            size: FONT_SIZE_SMALL,
          }),
          createTextRun(" de ", { size: FONT_SIZE_SMALL }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: FONT_FAMILY,
            size: FONT_SIZE_SMALL,
          }),
        ],
      }),
    ],
  });

  // Build document sections
  const documentChildren: Paragraph[] = [];

  // Header - Ao Juízo
  documentChildren.push(
    createParagraph(
      [createTextRun(`AO JUÍZO DE DIREITO DA __ VARA DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE ${client.city?.toUpperCase() || "MANAUS"}/${client.state || "AM"}`, { bold: true })],
      { alignment: AlignmentType.CENTER, spacing: { after: 600 } }
    )
  );

  // Qualificação do Autor
  documentChildren.push(
    createParagraph([
      createTextRun(client.name || "FULANO DE TAL", { bold: true }),
      createTextRun(`, ${client.nationality || "brasileiro"}, ${client.civilStatus || "estado civil"}, ${client.profession || "profissão"}, CPF Nº. ${client.cpf || "000.000.000-00"}, RG Nº. ${client.rg || "00000000"} - ${client.rgIssuer || "SSP/AM"}, residente e domiciliado no ${client.street || "..."}, nº ${client.number || "..."}, Bairro: ${client.neighborhood || "..."}, CEP: ${client.cep || "..."}, ${client.city || "Manaus"} – ${client.state || "Amazonas"}, por intermédio de seu advogado, legalmente constituído, com escritório profissional na ${office.address} - CEP ${office.cep}, ${office.city} – ${office.state}, onde recebe intimações e notificações, com base nos artigos 319 e seguintes do Código de Processo Civil, bem como no art. 5º, V, CRFB/88 e demais dispositivos legais previstos no Código de Defesa do Consumidor e na Autorregulação Bancária propor:`),
    ])
  );

  // Título da Ação
  documentChildren.push(
    createParagraph(
      [createTextRun("AÇÃO DE RESPONSABILIDADE CIVIL C/C INDENIZAÇÃO POR DANOS MATERIAIS E MORAIS POR COBRANÇA INDEVIDA", { bold: true })],
      { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }
    )
  );

  // Qualificação do Réu
  documentChildren.push(
    createParagraph([
      createTextRun("em face de "),
      createTextRun(bank.name || "BANCO EXEMPLO S/A", { bold: true }),
      createTextRun(`, pessoa jurídica de direito privado, com registro no CNPJ sob o nº ${bank.cnpj || "00.000.000/0001-00"}, com sede na cidade de ${bank.city || "Cidade"}/${bank.state || "UF"}, ${bank.address || "Endereço"}, CEP: ${bank.cep || "00.000-000"}, pelas razões de fato e de direito que passa a expor:`),
    ])
  );

  // I - DOS FATOS
  documentChildren.push(
    createParagraph([createTextRun("I - DOS FATOS", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`A parte Autora mantém vínculo contratual com a instituição financeira conforme comprovado (anexo 6), todavia, ao proceder à conferência de seus extratos, passou a constatar lançamentos mensais indevidos sob a rubrica "${chargeLabel}", sem que houvesse qualquer solicitação, anuência ou assinatura de contrato específico que legitimasse tais cobranças.`),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Ressalte-se que a parte autora jamais solicitou ou anuiu com a contratação de qualquer plano ou serviço adicional que pudesse justificar tais cobranças, tratando-se, portanto, de descontos unilaterais e abusivos."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Com base na tabela analítica obtida dos extratos bancários juntados aos autos, apresenta-se a seguir o detalhamento dos valores questionados:"),
    ])
  );

  // Tabela de cobranças
  if (charges.length > 0) {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [createParagraph([createTextRun("Data", { bold: true })], { alignment: AlignmentType.LEFT })],
            shading: { fill: "f0f0f0" },
          }),
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            children: [createParagraph([createTextRun("Descrição", { bold: true })], { alignment: AlignmentType.LEFT })],
            shading: { fill: "f0f0f0" },
          }),
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [createParagraph([createTextRun("Valor", { bold: true })], { alignment: AlignmentType.RIGHT })],
            shading: { fill: "f0f0f0" },
          }),
        ],
      }),
      ...charges.map(
        (charge) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2000, type: WidthType.DXA },
                children: [createParagraph([createTextRun(formatDateShort(charge.date))])],
              }),
              new TableCell({
                width: { size: 5000, type: WidthType.DXA },
                children: [createParagraph([createTextRun(charge.description)])],
              }),
              new TableCell({
                width: { size: 2000, type: WidthType.DXA },
                children: [createParagraph([createTextRun(formatCurrency(charge.value))], { alignment: AlignmentType.RIGHT })],
              }),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 7000, type: WidthType.DXA },
            children: [createParagraph([createTextRun("TOTAL", { bold: true })])],
            shading: { fill: "f5f5f5" },
          }),
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [createParagraph([createTextRun(formatCurrency(totalCharges), { bold: true })], { alignment: AlignmentType.RIGHT })],
            shading: { fill: "f5f5f5" },
          }),
        ],
      }),
    ];

    documentChildren.push(
      new Paragraph({
        children: [],
        spacing: { before: 200, after: 200 },
      }) as unknown as Paragraph
    );

    // Add table as a special element (we'll handle this differently)
  }

  // Continue with the rest of the petition text
  documentChildren.push(
    createParagraph([
      createTextRun(`Neste sentido, os valores cobrados INDEVIDAMENTE a título de "${chargeLabel}" soma a quantia de ${formatCurrencyExtended(totalCharges)}, com repetição do indébito (2x ${formatCurrency(totalCharges)}), totaliza o valor de ${formatCurrencyExtended(materialDamage)}, em virtude da devolução EM DOBRO.`),
    ])
  );

  // III - DO DIREITO
  documentChildren.push(
    createParagraph([createTextRun("III - DO DIREITO", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([createTextRun("III.I – DA APLICABILIDADE DO CÓDIGO DE DEFESA DO CONSUMIDOR E RELAÇÃO DE CONSUMO", { bold: true })], { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A presente demanda versa sobre relação de consumo, plenamente caracterizada pela existência de vínculo jurídico entre a instituição financeira, fornecedora de serviços bancários, e a parte autora, destinatária final desses serviços, nos termos dos artigos 2º e 3º do Código de Defesa do Consumidor (Lei nº 8.078/90)."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun('O entendimento é consolidado pela Súmula 297 do STJ, que dispõe: "O Código de Defesa do Consumidor é aplicável às instituições financeiras."'),
    ])
  );

  // V - DOS DANOS MATERIAIS
  documentChildren.push(
    createParagraph([createTextRun("V - DOS DANOS MATERIAIS – REPETIÇÃO DO INDÉBITO", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Assim, requer-se a condenação da parte ré à DEVOLUÇÃO EM DOBRO o valor de ${formatCurrencyExtended(materialDamage)}, devidamente CORRIGIDOS E ACRESCIDOS DE JUROS LEGAIS.`),
    ])
  );

  // VI - DOS DANOS MORAIS
  documentChildren.push(
    createParagraph([createTextRun("VI - DOS DANOS MORAIS", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Dessa forma, requer-se a condenação do Reclamado ao pagamento de INDENIZAÇÃO POR DANOS MORAIS, no valor de ${formatCurrencyExtended(moralDamage)}.`),
    ])
  );

  // VI.I - DO TEMPO DESPERDIÇADO
  if (wastedTimeDamage > 0) {
    documentChildren.push(
      createParagraph([createTextRun("VI.I – DO TEMPO DESPERDIÇADO", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
    );

    documentChildren.push(
      createParagraph([
        createTextRun(`Diante disso, requer-se o RECONHECIMENTO AUTÔNOMO DO DANO DECORRENTE DO TEMPO DESPERDIÇADO, fixando-se o valor indenizatório em ${formatCurrencyExtended(wastedTimeDamage)}.`),
      ])
    );
  }

  // VII - DOS PEDIDOS
  documentChildren.push(
    createParagraph([createTextRun("VII - DOS PEDIDOS", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([createTextRun("Ante o exposto, requer:")])
  );

  documentChildren.push(
    createParagraph([createTextRun("a) A concessão do benefício da justiça gratuita, nos termos do art. 98 do CPC;")])
  );
  documentChildren.push(
    createParagraph([createTextRun("b) A citação do Réu, no endereço constante do preâmbulo, para que, querendo, apresente resposta no prazo legal;")])
  );
  documentChildren.push(
    createParagraph([createTextRun("c) DISPENSA de Audiência de Conciliação por ser matéria de direito e comportar julgamento antecipado da lide;")])
  );
  documentChildren.push(
    createParagraph([createTextRun("d) CONDENAR o Requerido e julgar totalmente procedente o pedido;")])
  );
  documentChildren.push(
    createParagraph([createTextRun(`e) Que as indenizações sejam acumuladas, totalizando o valor de ${formatCurrencyExtended(totalValue)};`)])
  );

  // Valor da Causa
  documentChildren.push(
    createParagraph([createTextRun(`Dá-se à causa, o valor de ${formatCurrencyExtended(totalValue)}.`)], { spacing: { before: 400 } })
  );

  // Encerramento
  documentChildren.push(
    createParagraph([createTextRun("Nestes termos, pede deferimento.")], { spacing: { before: 200 } })
  );

  // Data e Local
  documentChildren.push(
    createParagraph(
      [createTextRun(`${client.city || "Manaus"} / ${client.state || "AM"}, ${formatDate(data.dateOfPetition)}`)],
      { alignment: AlignmentType.CENTER, spacing: { before: 600 } }
    )
  );

  // Assinatura
  documentChildren.push(
    createParagraph(
      [createTextRun("_________________________________")],
      { alignment: AlignmentType.CENTER, spacing: { before: 600 } }
    )
  );
  documentChildren.push(
    createParagraph([createTextRun("DANIEL SENA ALMEIDA", { bold: true })], { alignment: AlignmentType.CENTER })
  );
  documentChildren.push(
    createParagraph([createTextRun("OAB-AM 15.128 | OAB-CE 53.112-A | OAB-RR 806-A")], { alignment: AlignmentType.CENTER })
  );

  // Add screenshots section if any
  const screenshotChildren: (Paragraph | Table)[] = [];
  if (data.chargeScreenshots && data.chargeScreenshots.length > 0) {
    screenshotChildren.push(
      createParagraph([createTextRun("ANEXO - PRINTS DOS DESCONTOS", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 800, after: 400 } })
    );

    for (let i = 0; i < data.chargeScreenshots.length; i++) {
      try {
        const imageData = await base64ToArrayBuffer(data.chargeScreenshots[i]);
        screenshotChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                data: imageData,
                transformation: {
                  width: 500,
                  height: 300,
                },
                type: "png",
              }),
            ],
          })
        );
        screenshotChildren.push(
          createParagraph([createTextRun(`Print ${i + 1}`, { italics: true, size: FONT_SIZE_SMALL })], { alignment: AlignmentType.CENTER })
        );
      } catch (error) {
        console.error("Error adding image:", error);
      }
    }
  }

  // Create charge table
  const chargeTable = charges.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [createParagraph([createTextRun("Data", { bold: true })], { alignment: AlignmentType.LEFT })],
            shading: { fill: "f0f0f0" },
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [createParagraph([createTextRun("Descrição", { bold: true })], { alignment: AlignmentType.LEFT })],
            shading: { fill: "f0f0f0" },
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [createParagraph([createTextRun("Valor", { bold: true })], { alignment: AlignmentType.RIGHT })],
            shading: { fill: "f0f0f0" },
          }),
        ],
      }),
      ...charges.map(
        (charge) =>
          new TableRow({
            children: [
              new TableCell({
                children: [createParagraph([createTextRun(formatDateShort(charge.date))])],
              }),
              new TableCell({
                children: [createParagraph([createTextRun(charge.description)])],
              }),
              new TableCell({
                children: [createParagraph([createTextRun(formatCurrency(charge.value))], { alignment: AlignmentType.RIGHT })],
              }),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [createParagraph([createTextRun("TOTAL", { bold: true })])],
            shading: { fill: "f5f5f5" },
          }),
          new TableCell({
            children: [createParagraph([createTextRun(formatCurrency(totalCharges), { bold: true })], { alignment: AlignmentType.RIGHT })],
            shading: { fill: "f5f5f5" },
          }),
        ],
      }),
    ],
  }) : null;

  // Build final document
  const doc = new Document({
    sections: [
      {
        headers: {
          default: header,
        },
        footers: {
          default: footer,
        },
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          ...documentChildren.slice(0, 7), // Up to charges intro
          ...(chargeTable ? [chargeTable] : []),
          ...documentChildren.slice(7),
          ...screenshotChildren,
        ],
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `peticao_${client.name || "cliente"}_${new Date().toISOString().split("T")[0]}.docx`);
}
