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
} from "docx";
import { saveAs } from "file-saver";
import { Packer } from "docx";
import { PetitionData, PETITION_TYPE_LABELS, DEFAULT_OFFICE } from "@/types/petition";
import { formatCurrency, formatCurrencyExtended, formatDateShort, formatDate } from "@/utils/formatters";

const FONT_FAMILY = "Arial";
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_SMALL = 20; // 10pt
const FONT_SIZE_HEADER = 18; // 9pt

function createTextRun(text: string, options?: { bold?: boolean; size?: number; italics?: boolean; color?: string }) {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: options?.size || FONT_SIZE_NORMAL,
    bold: options?.bold,
    italics: options?.italics,
    color: options?.color,
  });
}

function createParagraph(
  children: TextRun[],
  options?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { after?: number; before?: number } }
) {
  return new Paragraph({
    children,
    alignment: options?.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: options?.spacing?.after ?? 200, before: options?.spacing?.before ?? 0 },
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

async function fetchImageAsArrayBuffer(imagePath: string): Promise<ArrayBuffer> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return await blob.arrayBuffer();
}

export async function exportToWord(data: PetitionData): Promise<void> {
  const { client, bank, charges, moralDamage, wastedTimeDamage, chargeDescription, petitionType } = data;
  const office = DEFAULT_OFFICE;

  const totalCharges = charges.reduce((sum, c) => sum + c.value, 0);
  const materialDamage = totalCharges * 2;
  const totalValue = materialDamage + moralDamage + wastedTimeDamage;
  const chargeLabel = chargeDescription || PETITION_TYPE_LABELS[petitionType];

  // Fetch header and footer images
  let headerImageData: ArrayBuffer | null = null;
  let footerImageData: ArrayBuffer | null = null;
  
  try {
    const headerModule = await import("@/assets/header-sena.png");
    const footerModule = await import("@/assets/footer-sena.png");
    headerImageData = await fetchImageAsArrayBuffer(headerModule.default);
    footerImageData = await fetchImageAsArrayBuffer(footerModule.default);
  } catch (error) {
    console.error("Error loading header/footer images:", error);
  }

  // Create header with image
  const headerChildren: Paragraph[] = [];
  
  if (headerImageData) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: headerImageData,
            transformation: {
              width: 600,
              height: 60,
            },
            type: "png",
          }),
        ],
      })
    );
  }

  const header = new Header({
    children: headerChildren,
  });

  // Create footer with image
  const footerChildren: Paragraph[] = [];
  
  if (footerImageData) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: footerImageData,
            transformation: {
              width: 600,
              height: 50,
            },
            type: "png",
          }),
        ],
      })
    );
  }

  const footer = new Footer({
    children: footerChildren,
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
      createTextRun(`A parte Autora mantém vínculo contratual com a instituição financeira conforme comprovado (anexo 6), todavia, ao proceder à conferência de seus extratos, passou a constatar lançamentos mensais indevidos sob a rubrica "${chargeLabel}", sem que houvesse qualquer solicitação, anuência ou assinatura de contrato específico que legitimasse tais cobranças. Evidencia-se, assim, a ocorrência de descontos unilaterais e abusivos, perpetrados em flagrante desrespeito aos princípios da lealdade contratual, da informação e da confiança, que regem as relações de consumo.`),
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

  // Placeholder for table position marker
  documentChildren.push(
    createParagraph([createTextRun("")], { spacing: { after: 100 } })
  );

  // Continue with the rest of the petition text
  documentChildren.push(
    createParagraph([
      createTextRun(`Neste sentido, os valores cobrados INDEVIDAMENTE a título de "${chargeLabel}" soma a quantia de ${formatCurrencyExtended(totalCharges)}, com repetição do indébito (2x ${formatCurrency(totalCharges)}), totaliza o valor de ${formatCurrencyExtended(materialDamage)}, em virtude da devolução EM DOBRO.`),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("O desconto de valores diversos sem comunicar ao consumidor previamente deixa clara a evidência de que a parte Ré faltou com o DEVER DE INFORMAÇÃO, além de boa fé e confiança, pois a transparência fortalece a confiança do consumidor, evitando práticas abusivas ou práticas enganosas."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Não restando alternativa a parte Autora, senão socorrer-se do Poder Judiciário para ver declarada a inexistência da relação jurídica que fundamentaria tais cobranças, bem como para restituir os valores pagos indevidamente e reparar os danos morais suportados diante da conduta abusiva da instituição financeira."),
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

  documentChildren.push(
    createParagraph([
      createTextRun(`O Banco Réu, ao realizar cobranças a título de "${chargeLabel}" sem respaldo contratual, violou frontalmente tais princípios, configurando prática abusiva e enriquecimento sem causa.`),
    ])
  );

  documentChildren.push(
    createParagraph([createTextRun("III.II – DA COBRANÇA INDEVIDA E DA REPETIÇÃO DO INDÉBITO", { bold: true })], { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A conduta da instituição financeira ré, ao realizar cobranças mensais por serviços não contratados, caracteriza típica prática abusiva, expressamente vedada pelo Código de Defesa do Consumidor."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Assim, resta evidente que a conduta da parte ré configura prática abusiva, nos termos do art. 39 do CDC, razão pela qual deve ser declarada a nulidade da cobrança indevida, com a consequente restituição dos valores pagos em dobro, além da indenização pelos danos morais sofridos."),
    ])
  );

  documentChildren.push(
    createParagraph([createTextRun("III.III – DA RESPONSABILIDADE OBJETIVA DA INSTITUIÇÃO FINANCEIRA", { bold: true })], { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A responsabilidade civil do Banco é objetiva, nos termos do art. 14 do CDC, bastando a comprovação da conduta lesiva, do dano e do nexo causal."),
    ])
  );

  documentChildren.push(
    createParagraph([createTextRun("III.IV – DA INVERSÃO DO ÔNUS DA PROVA", { bold: true })], { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Nos termos do art. 6º, inciso VIII, do CDC, é cabível a inversão do ônus da prova em favor do consumidor, diante da sua hipossuficiência técnica e da verossimilhança das alegações."),
    ])
  );

  // V - DOS DANOS MATERIAIS
  documentChildren.push(
    createParagraph([createTextRun("V - DOS DANOS MATERIAIS – REPETIÇÃO DO INDÉBITO", { bold: true })], { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Conforme amplamente demonstrado nos tópicos anteriores, a parte autora foi vítima de cobranças indevidas e reiteradas de um serviço não contratado."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Diante da cobrança indevida, faz jus à restituição dos valores pagos, conforme determina o art. 42, parágrafo único, do Código de Defesa do Consumidor."),
    ])
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
      createTextRun("A conduta da instituição ré ultrapassa os limites do mero aborrecimento ou dissabor cotidiano. A cobrança indevida de valores da conta bancária da autora, de forma reiterada e sem qualquer respaldo contratual, caracteriza evidente violação à dignidade do consumidor."),
    ])
  );

  documentChildren.push(
    createParagraph([
      createTextRun("O dano moral, neste contexto, é presumido (in re ipsa), pois decorre diretamente da afronta ao direito de personalidade, à confiança e à boa-fé objetiva."),
    ])
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
        createTextRun("Além dos prejuízos materiais e morais já demonstrados, cumpre destacar a incidência da Teoria do Desvio Produtivo do Consumidor."),
      ])
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
    createParagraph([createTextRun("d) CONDENAR o Requerido e julgar totalmente procedente o pedido para:")])
  );
  documentChildren.push(
    createParagraph([createTextRun(`   i. Seja declarada a inexistência da contratação e/ou autorização para os descontos realizados sob a rubrica "${chargeLabel}";`)])
  );
  documentChildren.push(
    createParagraph([createTextRun(`   ii. Condenar a parte ré à restituição em dobro dos valores indevidamente descontados, no valor de ${formatCurrencyExtended(materialDamage)};`)])
  );
  documentChildren.push(
    createParagraph([createTextRun(`   iii. Seja a parte ré condenada ao pagamento de indenização pelos danos morais sofridos, no valor de ${formatCurrencyExtended(moralDamage)};`)])
  );
  if (wastedTimeDamage > 0) {
    documentChildren.push(
      createParagraph([createTextRun(`   iv. Seja reconhecida e fixada a indenização autônoma pelo tempo desperdiçado, no valor de ${formatCurrencyExtended(wastedTimeDamage)};`)])
    );
  }
  documentChildren.push(
    createParagraph([createTextRun(`   v. Que as indenizações acima sejam acumuladas, totalizando o valor de ${formatCurrencyExtended(totalValue)};`)])
  );
  documentChildren.push(
    createParagraph([createTextRun("e) Seja condenado o Requerido a pagar as custas processuais e os honorários advocatícios;")])
  );
  documentChildren.push(
    createParagraph([createTextRun("f) A produção de todas as provas admitidas em direito.")])
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
