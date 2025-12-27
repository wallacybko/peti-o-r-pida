import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  ImageRun,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { Packer } from "docx";
import { PetitionData, DEFAULT_OFFICE } from "@/types/petition";
import { formatCurrency, formatDateShort, formatDate, formatCurrencyExtensoOnly } from "@/utils/formatters";

const FONT_FAMILY = "Arial";
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_SMALL = 20; // 10pt

function createTextRun(text: string, options?: { bold?: boolean; size?: number; italics?: boolean; color?: string; underline?: boolean }) {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: options?.size || FONT_SIZE_NORMAL,
    bold: options?.bold,
    italics: options?.italics,
    color: options?.color,
    underline: options?.underline ? {} : undefined,
  });
}

function createParagraph(
  children: TextRun[],
  options?: { 
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; 
    spacing?: { after?: number; before?: number; line?: number };
    indent?: { firstLine?: number };
  }
) {
  return new Paragraph({
    children,
    alignment: options?.alignment || AlignmentType.JUSTIFIED,
    spacing: { 
      after: options?.spacing?.after ?? 200, 
      before: options?.spacing?.before ?? 0,
      line: options?.spacing?.line ?? 360, // 1.5 line spacing
    },
    indent: options?.indent,
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
  const { client, bank, charges, moralDamage, wastedTimeDamage, chargeDescription } = data;
  const office = DEFAULT_OFFICE;

  const totalCharges = charges.reduce((sum, c) => sum + c.value, 0);
  const materialDamage = totalCharges * 2; // Repetição do indébito em dobro
  const totalValue = materialDamage + moralDamage + wastedTimeDamage;
  const rubrica = chargeDescription || "PACOTE DE SERVIÇO PADRONIZADO PRIORITÁRIOS I";
  
  // Comarca - usa o campo comarca do cliente ou a cidade como fallback
  const comarca = client.comarca || client.city?.toUpperCase() || "MANAUS";

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
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: headerImageData,
            transformation: { width: 150, height: 80 },
            type: "png",
          }),
        ],
      })
    );
  }
  const header = new Header({ children: headerChildren });

  // Create footer with image and contact info
  const footerChildren: Paragraph[] = [];
  if (footerImageData) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: footerImageData,
            transformation: { width: 500, height: 60 },
            type: "png",
          }),
        ],
      })
    );
  }
  const footer = new Footer({ children: footerChildren });

  // ========== DOCUMENT CONTENT ==========
  const documentChildren: (Paragraph | Table)[] = [];

  // ===== ENDEREÇAMENTO =====
  documentChildren.push(
    createParagraph(
      [createTextRun(`AO JUÍZO DE DIREITO DA VARA DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE ${comarca}`, { bold: true })],
      { alignment: AlignmentType.CENTER, spacing: { after: 600 } }
    )
  );

  // ===== QUALIFICAÇÃO DO AUTOR =====
  const clientAddress = `${client.street || "..."}, ${client.number || "S/N"}`;
  
  documentChildren.push(
    createParagraph([
      createTextRun(client.name || "NOME DO CLIENTE", { bold: true }),
      createTextRun(`, ${client.nationality || "brasileiro"}, ${client.civilStatus || "estado civil"}, ${client.profession || "profissão"}, CPF Nº. `),
      createTextRun(client.cpf || "000.000.000-00", { bold: true }),
      createTextRun(`, RG Nº. ${client.rg || "0000000"}, residente e domiciliado no ${clientAddress}, Bairro: ${client.neighborhood || "..."}, CEP: ${client.cep || "..."}, ${client.city || "Manaus"} / ${client.state || "AM"}, por intermédio de seu advogado, legalmente constituído, com escritório profissional na ${office.address} - CEP ${office.cep}, ${office.city} – ${office.state}, onde recebe intimações e notificações, com base nos artigos 319 e seguintes do Código de Processo Civil, bem como no art. 5º, V, CRFB/88 e demais dispositivos legais previstos no Código de Defesa do Consumidor e na Autorregulação Bancária propor:`),
    ])
  );

  // ===== TÍTULO DA AÇÃO =====
  documentChildren.push(
    createParagraph(
      [createTextRun("AÇÃO DE RESPONSABILIDADE CIVIL C/C INDENIZAÇÃO POR DANOS MATERIAIS E MORAIS POR COBRANÇA INDEVIDA", { bold: true })],
      { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }
    )
  );

  // ===== QUALIFICAÇÃO DO RÉU =====
  documentChildren.push(
    createParagraph([
      createTextRun("em face de "),
      createTextRun(bank.name || "BANCO EXEMPLO S/A", { bold: true }),
      createTextRun(`, pessoa jurídica de direito privado, com registro no CNPJ sob o nº `),
      createTextRun(bank.cnpj || "00.000.000/0001-00", { bold: true }),
      createTextRun(`, com sede na cidade de ${bank.address || "..."}, pelas razões de fato e de direito que passa a expor:`),
    ])
  );

  // ===== I - DOS FATOS =====
  documentChildren.push(
    createParagraph([createTextRun("I - DOS FATOS", { bold: true })], 
    { alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`A parte Autora mantém vínculo contratual com a instituição financeira conforme comprovado (anexo 6), todavia, ao proceder à conferência de seus extratos, descobriu que havia uma cobrança recorrente denominada `),
      createTextRun(rubrica, { bold: true }),
      createTextRun(`, sem que houvesse qualquer solicitação, anuência.`),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Evidencia-se, assim, a ocorrência de descontos unilaterais e abusivos, perpetrados em flagrante desrespeito aos princípios da lealdade contratual, da informação e da confiança, que regem as relações de consumo. Ressalte-se que a parte autora jamais solicitou ou anuiu com a contratação de qualquer plano ou serviço adicional que pudesse justificar tais cobranças, tratando-se, portanto, de descontos unilaterais e abusivos."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Com base na tabela analítica obtida dos extratos bancários juntados aos autos, apresenta-se a seguir o detalhamento dos valores questionados:"),
    ], { indent: { firstLine: 720 } })
  );

  // ===== TABELA DE COBRANÇAS =====
  if (charges.length > 0) {
    const chargeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [createParagraph([createTextRun("DATA", { bold: true })], { alignment: AlignmentType.CENTER })],
              shading: { fill: "E0E0E0" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [createParagraph([createTextRun("DESCRIÇÃO", { bold: true })], { alignment: AlignmentType.CENTER })],
              shading: { fill: "E0E0E0" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [createParagraph([createTextRun("VALOR", { bold: true })], { alignment: AlignmentType.CENTER })],
              shading: { fill: "E0E0E0" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
          ],
        }),
        ...charges.map(
          (charge) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [createParagraph([createTextRun(formatDateShort(charge.date))], { alignment: AlignmentType.CENTER })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [createParagraph([createTextRun(charge.description)])],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [createParagraph([createTextRun(formatCurrency(charge.value))], { alignment: AlignmentType.RIGHT })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            })
        ),
        // Total row
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              children: [createParagraph([createTextRun("TOTAL", { bold: true })], { alignment: AlignmentType.RIGHT })],
              shading: { fill: "F5F5F5" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
            new TableCell({
              children: [createParagraph([createTextRun(formatCurrency(totalCharges), { bold: true })], { alignment: AlignmentType.RIGHT })],
              shading: { fill: "F5F5F5" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
          ],
        }),
      ],
    });
    documentChildren.push(chargeTable);
  }

  // ===== TEXTO APÓS TABELA =====
  documentChildren.push(
    createParagraph([
      createTextRun(`Neste sentido, os valores cobrados INDEVIDAMENTE a título de ${rubrica}, soma a quantia de `),
      createTextRun(`${formatCurrency(totalCharges)} (${formatCurrencyExtensoOnly(totalCharges)})`, { bold: true }),
      createTextRun(` com repetição do indébito (2 x ${formatCurrency(totalCharges)}, totaliza o valor de `),
      createTextRun(`${formatCurrency(materialDamage)} (${formatCurrencyExtensoOnly(materialDamage)})`, { bold: true }),
      createTextRun(`, em virtude da devolução EM DOBRO.`),
    ], { spacing: { before: 300 }, indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("O desconto de valores diversos sem comunicar ao consumidor previamente deixa clara a evidência de que a parte Ré faltou com o DEVER DE INFORMAÇÃO, além de boa fé e confiança, pois a transparência fortalece a confiança do consumidor, evitando práticas abusivas ou práticas enganosas."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Não restando alternativa a parte Autora, senão socorrer-se do Poder Judiciário para ver declarada a inexistência da relação jurídica que fundamentaria tais cobranças, bem como para restituir os valores pagos abusiva da instituição financeira."),
    ], { indent: { firstLine: 720 } })
  );

  // ===== II - DO DIREITO =====
  documentChildren.push(
    createParagraph([createTextRun("II - DO DIREITO", { bold: true })], 
    { alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 } })
  );

  // a – DA APLICABILIDADE DO CDC
  documentChildren.push(
    createParagraph([createTextRun("a – DA APLICABILIDADE DO CÓDIGO DE DEFESA DO CONSUMIDOR E RELAÇÃO DE CONSUMO", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A presente demanda versa sobre relação de consumo, plenamente caracterizada pela existência de vínculo jurídico entre a instituição financeira, fornecedora de serviços bancários, e a parte autora, destinatária final desses serviços, nos termos dos artigos 2º e 3º do Código de Defesa do Consumidor (Lei nº 8.078/90)."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun('O entendimento é consolidado pela Súmula 297 do STJ, que dispõe: "O Código de Defesa do Consumidor é aplicável às instituições financeiras."'),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`O Banco Réu, ao realizar cobranças a título de ${rubrica} sem respaldo contratual, violou frontalmente tais princípios, configurando prática abusiva e enriquecimento sem causa. Dessa forma, é inequívoca a incidência das normas consumeristas ao caso em tela, devendo-se assegurar à parte autora a proteção conferida pelo diploma legal, especialmente quanto aos princípios da boa-fé objetiva, da transparência, da vulnerabilidade do consumidor e do equilíbrio contratual.`),
    ], { indent: { firstLine: 720 } })
  );

  // b – DA COBRANÇA INDEVIDA
  documentChildren.push(
    createParagraph([createTextRun("b – DA COBRANÇA INDEVIDA E DA REPETIÇÃO DO INDÉBITO", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A conduta da instituição financeira ré, ao realizar cobranças mensais por serviços não contratados, caracteriza típica prática abusiva, expressamente vedada pelo Código de Defesa do Consumidor."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("No caso em análise, a instituição ré impôs à autora a contratação de um SERVIÇO, que jamais foi solicitado ou autorizado, e, pior, passou a realizar descontos mensais recorrentes por tais serviços não reconhecidos, sem qualquer justificativa documental ou contratual."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A prestação unilateral de serviços, sem autorização ou ciência do consumidor, configura clara infração à boa-fé objetiva e à função social do contrato, conforme preconiza o art. 421 do Código Civil, além de violar o dever de informação previsto no art. 6º, III, do CDC."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Ressalte-se que a conduta da instituição não apenas fere o ordenamento jurídico, mas também agride a confiança depositada pela autora, afetando o equilíbrio contratual e impondo-lhe ônus excessivo, situação que, por si só, atrai a tutela jurisdicional reparatória e repressiva."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Assim, resta evidente que a conduta da parte ré configura prática abusiva, nos termos do art. 39 do CDC, razão pela qual deve ser declarada a nulidade da cobrança indevida, com a consequente restituição dos valores pagos em dobro, além da indenização pelos danos morais sofridos."),
    ], { indent: { firstLine: 720 } })
  );

  // c – DA RESPONSABILIDADE OBJETIVA
  documentChildren.push(
    createParagraph([createTextRun("c– DA RESPONSABILIDADE OBJETIVA DA INSTITUIÇÃO FINANCEIRA", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A responsabilidade civil do Banco é objetiva, nos termos do art. 14 do CDC, bastando a comprovação da conduta lesiva, do dano e do nexo causal."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun('No âmbito das relações bancárias, resta consolidado o entendimento de que os bancos se enquadram no conceito de fornecedores de serviços, enquanto o correntista figura como consumidor final, nos termos dos artigos 2º e 3º do CDC e da Súmula 297 do Superior Tribunal de Justiça, que estabelece que "O Código de Defesa do Consumidor é aplicável às instituições financeiras."'),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Assim, a responsabilidade da instituição financeira decorre da falha na prestação do serviço, prescindindo de qualquer demonstração de culpa. Basta que se comprove a conduta lesiva, o dano experimentado e o nexo causal entre ambos, sendo desnecessária a investigação da intenção ou negligência do agente."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Em suma, a responsabilidade objetiva das instituições financeiras traduz-se na aplicação concreta da teoria do risco do empreendimento, segundo a qual aquele que aufere lucro com a atividade econômica deve suportar os riscos inerentes à sua operação, garantindo ao consumidor a reparação integral dos prejuízos sofridos."),
    ], { indent: { firstLine: 720 } })
  );

  // d – DA INVERSÃO DO ÔNUS DA PROVA
  documentChildren.push(
    createParagraph([createTextRun("d – DA INVERSÃO DO ÔNUS DA PROVA", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Nos termos do art. 6º, inciso VIII, do CDC, é cabível a inversão do ônus da prova em favor do consumidor, diante da sua hipossuficiência técnica e da verossimilhança das alegações."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Cabe ao Banco Réu o ônus de demonstrar a existência de contratação válida que justifique os débitos questionados, sob pena de ver reconhecida a cobrança indevida e a consequente obrigação de restituição."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Importante frisar que, conforme estabelece o art. 6º, inciso VIII, do CDC, deve ser determinada a inversão do ônus da prova em favor do consumidor, dada a sua hipossuficiência técnica e a verossimilhança das alegações."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A aplicação do CDC é, portanto, imperiosa e imprescindível à solução da presente controvérsia, especialmente diante da prática abusiva de prestação de serviço sem consentimento, da falta de clareza nos lançamentos e da ausência de contrato firmado entre as partes. Portanto, não cabe à parte autora comprovar culpa ou dolo da instituição financeira, mas apenas a ocorrência do ato lesivo e o prejuízo decorrente."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Compete, por sua vez, ao banco, na forma do art. 14, §3º, do CDC, demonstrar que não houve defeito no serviço ou que o dano decorreu de culpa exclusiva do consumidor ou de terceiros, ônus do qual, ordinariamente, não se desincumbe."),
    ], { indent: { firstLine: 720 } })
  );

  // e - DOS DANOS MATERIAIS
  documentChildren.push(
    createParagraph([createTextRun("e - DOS DANOS MATERIAIS – REPETIÇÃO DO INDÉBITO", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Conforme amplamente demonstrado nos tópicos anteriores, a parte autora foi vítima de cobranças indevidas e reiteradas de um serviço não contratado, sem que houvesse qualquer anuência, consentimento ou contratação formal para tal serviço. Diante da cobrança indevida, faz jus à restituição dos valores pagos, conforme determina o art. 42, parágrafo único, do Código de Defesa do Consumidor."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("No presente caso, não há qualquer indício de engano justificável. Ao contrário: os descontos foram realizados de forma sistemática, por vários anos, sem contrato, sem ciência ou autorização da autora. A conduta da instituição financeira foi deliberada e reiterada, o que agrava sua responsabilidade civil."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Ressalte-se que a repetição do indébito, em dobro, não depende de prova do dolo ou má-fé, sendo suficiente a comprovação do pagamento indevido e da ausência de autorização, requisitos amplamente preenchidos neste feito."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Assim, requer-se a condenação da parte ré à DEVOLUÇÃO EM DOBRO o valor de `),
      createTextRun(`${formatCurrency(materialDamage)} (${formatCurrencyExtensoOnly(materialDamage)})`, { bold: true }),
      createTextRun(`, conforme fl. 03 dos autos de todos os valores indevidamente descontados, DESDE O PRIMEIRO EVENTO DANOSO até a CESSAÇÃO DA COBRANÇA, devidamente CORRIGIDOS E ACRESCIDOS DE JUROS LEGAIS, os quais devem incidir a partir do evento danoso, conforme orientação da Súmula 54 do STJ segundo a qual "OS JUROS MORATÓRIOS FLUEM A PARTIR DO EVENTO DANOSO, EM CASO DE RESPONSABILIDADE EXTRACONTRATUAL" conforme apuração dos extratos bancários anexados demonstrado na fl. 03 dos autos.`),
    ], { indent: { firstLine: 720 } })
  );

  // f - DOS DANOS MORAIS
  documentChildren.push(
    createParagraph([createTextRun("f - DOS DANOS MORAIS", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A conduta da instituição ré ultrapassa os limites do mero aborrecimento ou dissabor cotidiano. A cobrança indevida de valores da conta bancária da autora, de forma reiterada e sem qualquer respaldo contratual, perdurando por anos, caracteriza evidente violação à dignidade do consumidor e atinge a esfera extrapatrimonial da parte autora."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("O dano moral, neste contexto, é presumido (in re ipsa), pois decorre diretamente da afronta ao direito de personalidade, à confiança e à boa-fé objetiva que devem nortear as relações de consumo. Trata-se de situação que envolve abusividade contratual, desrespeito à transparência e lesão econômica continuada ao consumidor vulnerável."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A jurisprudência é pacífica em reconhecer o direito à indenização por danos morais nas hipóteses de descontos indevidos, não contratados, em contas bancárias, especialmente quando há reiteração e ausência de solução administrativa. Segundo entendimento firmado pelo Tribunal de Justiça do Amazonas, reconhece a devolução em dobro nesses casos:"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun('"É dever da instituição financeira comprovar a contratação do pacote de serviços bancários quando realiza descontos na conta do consumidor. Na ausência dessa prova, a cobrança configura prática abusiva e enseja a restituição em dobro dos valores indevidamente debitados, nos termos do art. 42, parágrafo único, do Código de Defesa do Consumidor. Além disso, o dano moral decorrente dessa conduta é presumido (in re ipsa), dispensando demonstração específica de prejuízo, fixando-se, no caso analisado, indenização no valor de R$ 5.000,00."', { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("(TJ-AM, Apelação Cível nº 0624128-78.2022.8.04.0001, Rel. Des. Yedo Simões de Oliveira, 2ª Câmara Cível, julgado em 01/06/2024, publicado em 13/11/2023).", { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Ademais, a TEORIA ADOTADA PELA DOUTRINA e jurisprudência brasileira quanto à fixação do dano moral é a do DESESTÍMULO, ou seja: o quantum indenizatório arbitrado deve estabelecer uma quantia significativa, de modo a conscientizar o ofensor de que não deve persistir no comportamento lesivo."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Dessa forma, requer-se a condenação do Reclamado ao pagamento de INDENIZAÇÃO POR DANOS MORAIS, em razão das práticas abusivas e ilegais perpetradas, no valor não inferior a `),
      createTextRun(`${formatCurrency(moralDamage)} (${formatCurrencyExtensoOnly(moralDamage)})`, { bold: true }),
      createTextRun(`, quantia esta que se revela compatível com os princípios da razoabilidade, proporcionalidade e função pedagógica da reparação civil. Tal pleito não busca qualquer enriquecimento sem causa, mas apenas o reconhecimento e a justa compensação pelo desrespeito e pela frustração da confiança depositada pela consumidora nos serviços do ${bank.name}.`),
    ], { indent: { firstLine: 720 } })
  );

  // g – DO TEMPO DESPERDIÇADO
  documentChildren.push(
    createParagraph([createTextRun("g – DO TEMPO DESPERDIÇADO", { bold: true })], 
    { spacing: { before: 300, after: 200 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Além dos prejuízos materiais e morais já demonstrados, cumpre destacar a incidência da Teoria do Desvio Produtivo do Consumidor, também denominada Teoria do Tempo Desperdiçado, desenvolvida por Marcos Dessaune e amplamente acolhida pela doutrina e jurisprudência pátrias, inclusive pelo Superior Tribunal de Justiça."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Tal teoria reconhece que o tempo útil que o consumidor é compelido a despender para resolver problemas decorrentes de falhas na prestação de serviços, como cobranças indevidas, omissões e desorganização por parte do fornecedor, constitui dano moral indenizável, por violar direitos da personalidade, frustrar a legítima expectativa de boa-fé e impor desgaste emocional, estresse e perda de tempo existencial."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("O STJ já consolidou esse entendimento:"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun('"O tempo despendido pelo consumidor para resolver problemas gerados por maus fornecedores de serviços configura dano moral indenizável, uma vez que representa desvio produtivo do seu tempo existencial."', { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("(STJ, AgInt no AREsp 1.260.458/SP, Rel. Min. Nancy Andrighi, 3ª Turma, julgado em 19/02/2019).", { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("No mesmo sentido, o Tribunal de Justiça do Amazonas vem aplicando tal teoria ao reconhecer o tempo gasto pelo consumidor para solucionar cobranças indevidas como dano autônomo e cumulável com o dano moral tradicional:"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun('"Apelação Cível. Relação de Consumo. Cobrança Indevida. Dano Moral. Teoria do Desvio Produtivo do Consumidor. Reconhecimento. O tempo despendido pelo consumidor para solucionar problemas causados por falha na prestação do serviço configura dano indenizável, pois representa desvio produtivo e violação ao direito à tranquilidade. Indenização mantida em valor compatível com a extensão do dano."', { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("(TJ-AM, Apelação Cível nº 0632143-84.2023.8.04.0001, Rel. Des. Anselmo Chíxaro, 3ª Câmara Cível, julgado em 05/04/2024, publicado em 11/04/2024).", { italics: true }),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("No caso concreto, a parte autora foi compelida a despender tempo e energia, e ao percorrer todo o caminho até acionar o Poder Judiciário para ver cessada a prática abusiva. Tal circunstância caracteriza perda de tempo útil, ofensa à dignidade e violação ao direito fundamental ao sossego e à confiança nas relações de consumo."),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Diante disso, requer-se o RECONHECIMENTO AUTÔNOMO DO DANO DECORRENTE DO TEMPO DESPERDIÇADO, fixando-se o valor indenizatório em `),
      createTextRun(`${formatCurrency(wastedTimeDamage)} (${formatCurrencyExtensoOnly(wastedTimeDamage)})`, { bold: true }),
      createTextRun(`, a título de compensação pelo desvio produtivo e desgaste emocional suportado pela consumidora.`),
    ], { indent: { firstLine: 720 } })
  );

  // ===== III – DOS PEDIDOS =====
  documentChildren.push(
    createParagraph([createTextRun("III – DOS PEDIDOS", { bold: true })], 
    { alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 } })
  );

  documentChildren.push(
    createParagraph([createTextRun("Ante o exposto, requer:")], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("1. A concessão do benefício da justiça gratuita, nos termos do art. 98 do CPC, diante da hipossuficiência econômica do Autor, trabalhador industriário, conforme declaração anexa;"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("2. A citação do Réu, no endereço constante do preâmbulo, para que, querendo, apresente resposta no prazo legal, sob pena de revelia e confissão quanto à matéria de fato (art. 344 do CPC);"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("3. DISPENSA de Audiência de Conciliação por ser matéria de direito e comportar julgamento antecipado da lide, bem como requerer a tramitação do feito exclusivamente pela via 100% digital;"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("4. CONDENAR o Requerido e julgar totalmente procedente o pedido para:"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`a. Para APRESENTAR OS CONTRATOS ESPECÍFICOS assinados pela parte Requerente, ou mídias (vídeos, áudios) que ensejem as cobranças dos pacotes bancários denominadas, "${rubrica}" conforme exige as Resoluções nº 3.919/10 e 4.196/2013 do BACEN e, se caso o Requerido apresente os contratos específicos, a comprovação dos aditivos com a anuência do consumidor durante o decorrer do período de desconto que justifique os valores adversos;`),
    ], { indent: { firstLine: 1080 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("b. Seja reconhecida a relação de consumo entre as partes, aplicando-se integralmente o Código de Defesa do Consumidor (arts. 2º, 3º e 14 do CDC), com a consequente inversão do ônus da prova (art. 6º, VIII, do CDC), diante da hipossuficiência técnica e econômica da parte autora."),
    ], { indent: { firstLine: 1080 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`c. Seja declarada a inexistência da contratação e/ou autorização para os descontos realizados sob a rubrica "${rubrica}", reconhecendo-se a ilegalidade e abusividade da conduta da instituição ré.`),
    ], { indent: { firstLine: 1080 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`d. Condenar a parte ré à restituição em dobro dos valores indevidamente descontados a título de ${rubrica}, que soma a quantia de `),
      createTextRun(`${formatCurrency(totalCharges)} (${formatCurrencyExtensoOnly(totalCharges)})`, { bold: true }),
      createTextRun(`, com repetição do indébito (2 x ${formatCurrency(totalCharges)}, totaliza o valor de `),
      createTextRun(`${formatCurrency(materialDamage)} (${formatCurrencyExtensoOnly(materialDamage)})`, { bold: true }),
      createTextRun(`, em virtude da repetição do indébito, legalmente corrigidos e atualizados os quais devem incidir a partir do evento danoso, nos termos da Súmula 54 do STJ;`),
    ], { indent: { firstLine: 1080 } })
  );

  // 5. Dos Danos Morais
  documentChildren.push(
    createParagraph([createTextRun("5. Dos Danos Morais", { bold: true })], 
    { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Seja a parte ré condenada ao pagamento de indenização pelos danos morais sofridos, no valor de `),
      createTextRun(`${formatCurrency(moralDamage)} (${formatCurrencyExtensoOnly(moralDamage)})`, { bold: true }),
      createTextRun(`, em razão da conduta abusiva e reiterada, que violou a dignidade, tranquilidade e confiança da parte consumidora.`),
    ], { indent: { firstLine: 720 } })
  );

  // 6. Do Tempo Desperdiçado
  documentChildren.push(
    createParagraph([createTextRun("6. Do Tempo Desperdiçado (Desvio Produtivo do Consumidor)", { bold: true })], 
    { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Seja reconhecida e fixada a indenização autônoma pelo tempo desperdiçado, com fundamento na Teoria do Desvio Produtivo do Consumidor, no valor de `),
      createTextRun(`${formatCurrency(wastedTimeDamage)} (${formatCurrencyExtensoOnly(wastedTimeDamage)})`, { bold: true }),
      createTextRun(`, considerando o tempo e esforço despendidos pela autora para resolver problema causado exclusivamente pela instituição financeira;`),
    ], { indent: { firstLine: 720 } })
  );

  // 7. Do Valor Total
  documentChildren.push(
    createParagraph([createTextRun("7. Do Valor Total da Indenização", { bold: true })], 
    { spacing: { before: 200, after: 100 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun(`Que as indenizações acima sejam acumuladas, totalizando o valor de `),
      createTextRun(`${formatCurrency(totalValue)} (${formatCurrencyExtensoOnly(totalValue)})`, { bold: true }),
      createTextRun(`, corrigidos e atualizados, que seja pago acrescidos de juros de mora desde o evento danoso, conforme as Súmulas 43 e 54 do STJ, observando-se os princípios da razoabilidade, proporcionalidade e função pedagógica da indenização.`),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Seja condenado o Requerido a pagar as custas processuais e os honorários advocatícios, em até 20% ou a critério de Vossa Excelência;"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("Que ao final, SEJA JULGADA TOTALMENTE PROCEDENTE a presente ação, ratificando a tutela concedida para condenar o Banco Réu na conformidade dos pedidos;"),
    ], { indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([
      createTextRun("A produção de todas as provas admitidas em direito, em especial prova documental, pericial e testemunhal, caso necessário à comprovação dos fatos alegados;"),
    ], { indent: { firstLine: 720 } })
  );

  // VALOR DA CAUSA
  documentChildren.push(
    createParagraph([
      createTextRun(`Dá-se à causa, o valor de `),
      createTextRun(`${formatCurrency(totalValue)} (${formatCurrencyExtensoOnly(totalValue)})`, { bold: true }),
    ], { spacing: { before: 400 }, indent: { firstLine: 720 } })
  );

  documentChildren.push(
    createParagraph([createTextRun("Nestes termos, pede deferimento.")], 
    { spacing: { before: 300 }, indent: { firstLine: 720 } })
  );

  // DATA E LOCAL
  documentChildren.push(
    createParagraph(
      [createTextRun(`${client.city || "Manaus"} / ${client.state || "AM"}, ${formatDate(data.dateOfPetition)}`)],
      { alignment: AlignmentType.CENTER, spacing: { before: 600 } }
    )
  );

  // ASSINATURA
  documentChildren.push(
    createParagraph(
      [createTextRun("")],
      { spacing: { before: 800 } }
    )
  );

  documentChildren.push(
    createParagraph(
      [createTextRun("DANIEL SENA ALMEIDA", { bold: true })],
      { alignment: AlignmentType.CENTER }
    )
  );

  documentChildren.push(
    createParagraph(
      [createTextRun("OAB-AM 15.128 OAB-CE 53.112-A OAB-RR 806-A")],
      { alignment: AlignmentType.CENTER }
    )
  );

  // ===== ANEXOS - SCREENSHOTS =====
  if (data.chargeScreenshots && data.chargeScreenshots.length > 0) {
    documentChildren.push(
      createParagraph([createTextRun("ANEXO - PRINTS DOS DESCONTOS", { bold: true })], 
      { alignment: AlignmentType.CENTER, spacing: { before: 800, after: 400 } })
    );

    for (let i = 0; i < data.chargeScreenshots.length; i++) {
      try {
        const imageData = await base64ToArrayBuffer(data.chargeScreenshots[i]);
        documentChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                data: imageData,
                transformation: { width: 500, height: 300 },
                type: "png",
              }),
            ],
          })
        );
        documentChildren.push(
          createParagraph([createTextRun(`Print ${i + 1}`, { italics: true, size: FONT_SIZE_SMALL })], 
          { alignment: AlignmentType.CENTER })
        );
      } catch (error) {
        console.error("Error adding image:", error);
      }
    }
  }

  // ===== BUILD DOCUMENT =====
  const doc = new Document({
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: documentChildren,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `peticao_${client.name || "cliente"}_${new Date().toISOString().split("T")[0]}.docx`);
}
