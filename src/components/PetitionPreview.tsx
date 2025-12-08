import { PetitionData, PETITION_TYPE_LABELS, DEFAULT_OFFICE } from "@/types/petition";
import { formatCurrency, formatCurrencyExtended, formatDate, formatDateShort } from "@/utils/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PetitionPreviewProps {
  data: PetitionData;
}

export function PetitionPreview({ data }: PetitionPreviewProps) {
  const { client, bank, charges, moralDamage, wastedTimeDamage, chargeDescription, petitionType, chargeScreenshots } = data;
  const office = DEFAULT_OFFICE;

  const totalCharges = charges.reduce((sum, c) => sum + c.value, 0);
  const materialDamage = totalCharges * 2;
  const totalIndenization = moralDamage + wastedTimeDamage;
  const totalValue = materialDamage + totalIndenization;

  const chargeLabel = chargeDescription || PETITION_TYPE_LABELS[petitionType];

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] w-full">
      <div className="legal-document bg-white p-8 max-w-[21cm] mx-auto shadow-lg" id="petition-content">
        {/* Header with Office Identity */}
        <div className="border-b-4 border-navy pb-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy tracking-wide">{office.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {office.address} - CEP: {office.cep}
            </p>
            <p className="text-sm text-gray-600">
              {office.city}/{office.state} | {office.phone} | {office.email}
            </p>
          </div>
        </div>

        {/* Ao Juízo */}
        <div className="text-center mb-8">
          <p className="font-bold">
            AO JUÍZO DE DIREITO DA __ VARA DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE {client.city?.toUpperCase() || 'MANAUS'}/{client.state || 'AM'}
          </p>
        </div>

        {/* Qualificação do Autor */}
        <div className="text-justify mb-6 leading-relaxed">
          <p>
            <strong>{client.name || 'FULANO DE TAL'}</strong>, {client.nationality || 'brasileiro'}, {client.civilStatus || 'estado civil'}, {client.profession || 'profissão'}, CPF Nº. {client.cpf || '000.000.000-00'}, RG Nº. {client.rg || '00000000'} - {client.rgIssuer || 'SSP/AM'}, residente e domiciliado no {client.street || '...'}, nº {client.number || '...'}, Bairro: {client.neighborhood || '...'}, CEP: {client.cep || '...'}, {client.city || 'Manaus'} – {client.state || 'Amazonas'}, por intermédio de seu advogado, legalmente constituído, com escritório profissional na {office.address} - CEP {office.cep}, {office.city} – {office.state}, onde recebe intimações e notificações, com base nos artigos 319 e seguintes do Código de Processo Civil, bem como no art. 5º, V, CRFB/88 e demais dispositivos legais previstos no Código de Defesa do Consumidor e na Autorregulação Bancária propor:
          </p>
        </div>

        {/* Título da Ação */}
        <div className="text-center my-8">
          <h1 className="text-lg font-bold uppercase">
            AÇÃO DE RESPONSABILIDADE CIVIL C/C INDENIZAÇÃO POR DANOS MATERIAIS E MORAIS POR COBRANÇA INDEVIDA
          </h1>
        </div>

        {/* Qualificação do Réu */}
        <div className="text-justify mb-8 leading-relaxed">
          <p>
            em face de <strong>{bank.name || 'BANCO EXEMPLO S/A'}</strong>, pessoa jurídica de direito privado, com registro no CNPJ sob o nº {bank.cnpj || '00.000.000/0001-00'}, com sede na cidade de {bank.city || 'Cidade'}/{bank.state || 'UF'}, {bank.address || 'Endereço'}, CEP: {bank.cep || '00.000-000'}, pelas razões de fato e de direito que passa a expor:
          </p>
        </div>

        {/* I - DOS FATOS */}
        <div className="mb-6">
          <h2 className="font-bold text-center mb-4">I - DOS FATOS</h2>
          <div className="text-justify leading-relaxed space-y-4">
            <p>
              A parte Autora mantém vínculo contratual com a instituição financeira conforme comprovado (anexo 6), todavia, ao proceder à conferência de seus extratos, passou a constatar lançamentos mensais indevidos sob a rubrica "{chargeLabel}", sem que houvesse qualquer solicitação, anuência ou assinatura de contrato específico que legitimasse tais cobranças. Evidencia-se, assim, a ocorrência de descontos unilaterais e abusivos, perpetrados em flagrante desrespeito aos princípios da lealdade contratual, da informação e da confiança, que regem as relações de consumo.
            </p>
            <p>
              Ressalte-se que a parte autora jamais solicitou ou anuiu com a contratação de qualquer plano ou serviço adicional que pudesse justificar tais cobranças, tratando-se, portanto, de descontos unilaterais e abusivos.
            </p>
            <p>
              Com base na tabela analítica obtida dos extratos bancários juntados aos autos, apresenta-se a seguir o detalhamento dos valores questionados:
            </p>
          </div>
        </div>

        {/* Tabela de Cobranças */}
        {charges.length > 0 && (
          <div className="my-6">
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Data</th>
                  <th className="border border-gray-400 p-2 text-left">Descrição</th>
                  <th className="border border-gray-400 p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id}>
                    <td className="border border-gray-400 p-2">{formatDateShort(charge.date)}</td>
                    <td className="border border-gray-400 p-2">{charge.description}</td>
                    <td className="border border-gray-400 p-2 text-right">{formatCurrency(charge.value)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className="border border-gray-400 p-2" colSpan={2}>TOTAL</td>
                  <td className="border border-gray-400 p-2 text-right">{formatCurrency(totalCharges)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="text-justify leading-relaxed space-y-4 mb-6">
          <p>
            Neste sentido, os valores cobrados INDEVIDAMENTE a título de "{chargeLabel}" soma a quantia de {formatCurrencyExtended(totalCharges)}, com repetição do indébito (2x {formatCurrency(totalCharges)}), totaliza o valor de {formatCurrencyExtended(materialDamage)}, em virtude da devolução EM DOBRO.
          </p>
          <p>
            O desconto de valores diversos sem comunicar ao consumidor previamente deixa clara a evidência de que a parte Ré faltou com o DEVER DE INFORMAÇÃO, além de boa fé e confiança, pois a transparência fortalece a confiança do consumidor, evitando práticas abusivas ou práticas enganosas.
          </p>
          <p>
            Não restando alternativa a parte Autora, senão socorrer-se do Poder Judiciário para ver declarada a inexistência da relação jurídica que fundamentaria tais cobranças, bem como para restituir os valores pagos indevidamente e reparar os danos morais suportados diante da conduta abusiva da instituição financeira.
          </p>
        </div>

        {/* Screenshots dos Descontos */}
        {chargeScreenshots && chargeScreenshots.length > 0 && (
          <div className="my-6">
            <h3 className="font-bold mb-3">Prints dos Extratos:</h3>
            <div className="grid grid-cols-2 gap-4">
              {chargeScreenshots.map((screenshot, index) => (
                <div key={index} className="border border-gray-300 rounded p-2">
                  <img src={screenshot} alt={`Print ${index + 1}`} className="w-full h-auto" />
                  <p className="text-center text-xs text-gray-500 mt-1">Print {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* III - DO DIREITO */}
        <div className="mb-6">
          <h2 className="font-bold text-center mb-4">III - DO DIREITO</h2>
          
          <h3 className="font-bold mb-3">III.I – DA APLICABILIDADE DO CÓDIGO DE DEFESA DO CONSUMIDOR E RELAÇÃO DE CONSUMO</h3>
          <div className="text-justify leading-relaxed space-y-4 mb-6">
            <p>
              A presente demanda versa sobre relação de consumo, plenamente caracterizada pela existência de vínculo jurídico entre a instituição financeira, fornecedora de serviços bancários, e a parte autora, destinatária final desses serviços, nos termos dos artigos 2º e 3º do Código de Defesa do Consumidor (Lei nº 8.078/90).
            </p>
            <p>
              O entendimento é consolidado pela Súmula 297 do STJ, que dispõe: "O Código de Defesa do Consumidor é aplicável às instituições financeiras."
            </p>
            <p>
              O Banco Réu, ao realizar cobranças a título de "{chargeLabel}" sem respaldo contratual, violou frontalmente tais princípios, configurando prática abusiva e enriquecimento sem causa.
            </p>
          </div>

          <h3 className="font-bold mb-3">III.II – DA COBRANÇA INDEVIDA E DA REPETIÇÃO DO INDÉBITO</h3>
          <div className="text-justify leading-relaxed space-y-4 mb-6">
            <p>
              A conduta da instituição financeira ré, ao realizar cobranças mensais por serviços não contratados, caracteriza típica prática abusiva, expressamente vedada pelo Código de Defesa do Consumidor.
            </p>
            <p>
              Assim, resta evidente que a conduta da parte ré configura prática abusiva, nos termos do art. 39 do CDC, razão pela qual deve ser declarada a nulidade da cobrança indevida, com a consequente restituição dos valores pagos em dobro, além da indenização pelos danos morais sofridos.
            </p>
          </div>

          <h3 className="font-bold mb-3">III.III – DA RESPONSABILIDADE OBJETIVA DA INSTITUIÇÃO FINANCEIRA</h3>
          <div className="text-justify leading-relaxed space-y-4 mb-6">
            <p>
              A responsabilidade civil do Banco é objetiva, nos termos do art. 14 do CDC, bastando a comprovação da conduta lesiva, do dano e do nexo causal.
            </p>
          </div>

          <h3 className="font-bold mb-3">III.IV – DA INVERSÃO DO ÔNUS DA PROVA</h3>
          <div className="text-justify leading-relaxed space-y-4 mb-6">
            <p>
              Nos termos do art. 6º, inciso VIII, do CDC, é cabível a inversão do ônus da prova em favor do consumidor, diante da sua hipossuficiência técnica e da verossimilhança das alegações.
            </p>
          </div>
        </div>

        {/* V - DOS DANOS MATERIAIS */}
        <div className="mb-6">
          <h2 className="font-bold text-center mb-4">V - DOS DANOS MATERIAIS – REPETIÇÃO DO INDÉBITO</h2>
          <div className="text-justify leading-relaxed space-y-4">
            <p>
              Conforme amplamente demonstrado nos tópicos anteriores, a parte autora foi vítima de cobranças indevidas e reiteradas de um serviço não contratado.
            </p>
            <p>
              Diante da cobrança indevida, faz jus à restituição dos valores pagos, conforme determina o art. 42, parágrafo único, do Código de Defesa do Consumidor.
            </p>
            <p>
              Assim, requer-se a condenação da parte ré à DEVOLUÇÃO EM DOBRO o valor de {formatCurrencyExtended(materialDamage)}, devidamente CORRIGIDOS E ACRESCIDOS DE JUROS LEGAIS.
            </p>
          </div>
        </div>

        {/* VI - DOS DANOS MORAIS */}
        <div className="mb-6">
          <h2 className="font-bold text-center mb-4">VI - DOS DANOS MORAIS</h2>
          <div className="text-justify leading-relaxed space-y-4">
            <p>
              A conduta da instituição ré ultrapassa os limites do mero aborrecimento ou dissabor cotidiano. A cobrança indevida de valores da conta bancária da autora, de forma reiterada e sem qualquer respaldo contratual, caracteriza evidente violação à dignidade do consumidor.
            </p>
            <p>
              O dano moral, neste contexto, é presumido (in re ipsa), pois decorre diretamente da afronta ao direito de personalidade, à confiança e à boa-fé objetiva.
            </p>
            <p>
              Dessa forma, requer-se a condenação do Reclamado ao pagamento de INDENIZAÇÃO POR DANOS MORAIS, no valor de {formatCurrencyExtended(moralDamage)}.
            </p>
          </div>
        </div>

        {/* VI.I - DO TEMPO DESPERDIÇADO */}
        {wastedTimeDamage > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-center mb-4">VI.I – DO TEMPO DESPERDIÇADO</h2>
            <div className="text-justify leading-relaxed space-y-4">
              <p>
                Além dos prejuízos materiais e morais já demonstrados, cumpre destacar a incidência da Teoria do Desvio Produtivo do Consumidor.
              </p>
              <p>
                Diante disso, requer-se o RECONHECIMENTO AUTÔNOMO DO DANO DECORRENTE DO TEMPO DESPERDIÇADO, fixando-se o valor indenizatório em {formatCurrencyExtended(wastedTimeDamage)}.
              </p>
            </div>
          </div>
        )}

        {/* VII - DOS PEDIDOS */}
        <div className="mb-6">
          <h2 className="font-bold text-center mb-4">VII - DOS PEDIDOS</h2>
          <div className="text-justify leading-relaxed">
            <p className="mb-4">Ante o exposto, requer:</p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>A concessão do benefício da justiça gratuita, nos termos do art. 98 do CPC;</li>
              <li>A citação do Réu, no endereço constante do preâmbulo, para que, querendo, apresente resposta no prazo legal;</li>
              <li>DISPENSA de Audiência de Conciliação por ser matéria de direito e comportar julgamento antecipado da lide;</li>
              <li>
                CONDENAR o Requerido e julgar totalmente procedente o pedido para:
                <ol className="list-[lower-alpha] pl-6 mt-2 space-y-2">
                  <li>Seja declarada a inexistência da contratação e/ou autorização para os descontos realizados sob a rubrica "{chargeLabel}";</li>
                  <li>Condenar a parte ré à restituição em dobro dos valores indevidamente descontados, no valor de {formatCurrencyExtended(materialDamage)};</li>
                  <li>Seja a parte ré condenada ao pagamento de indenização pelos danos morais sofridos, no valor de {formatCurrencyExtended(moralDamage)};</li>
                  {wastedTimeDamage > 0 && (
                    <li>Seja reconhecida e fixada a indenização autônoma pelo tempo desperdiçado, no valor de {formatCurrencyExtended(wastedTimeDamage)};</li>
                  )}
                  <li>Que as indenizações acima sejam acumuladas, totalizando o valor de {formatCurrencyExtended(totalValue)};</li>
                </ol>
              </li>
              <li>Seja condenado o Requerido a pagar as custas processuais e os honorários advocatícios;</li>
              <li>A produção de todas as provas admitidas em direito.</li>
            </ol>
          </div>
        </div>

        {/* Valor da Causa */}
        <div className="text-justify my-8">
          <p>
            Dá-se à causa, o valor de {formatCurrencyExtended(totalValue)}.
          </p>
        </div>

        {/* Encerramento */}
        <div className="text-justify mb-8">
          <p>Nestes termos, pede deferimento.</p>
        </div>

        {/* Data e Assinatura */}
        <div className="text-center mt-12">
          <p>{client.city || 'Manaus'} / {client.state || 'AM'}, {formatDate(data.dateOfPetition)}</p>
          <div className="mt-12">
            <p className="border-t border-black inline-block pt-2 px-16">
              <strong>DANIEL SENA ALMEIDA</strong><br />
              OAB-AM 15.128<br />
              OAB-CE 53.112-A<br />
              OAB-RR 806-A
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t-4 border-navy text-center text-sm text-gray-600">
          <p className="font-semibold text-navy">{office.name}</p>
          <p>{office.website}</p>
        </div>
      </div>
    </ScrollArea>
  );
}
