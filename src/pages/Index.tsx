import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/ClientForm";
import { BankForm } from "@/components/BankForm";
import { ChargesForm } from "@/components/ChargesForm";
import { PetitionPreview } from "@/components/PetitionPreview";
import { PetitionData, ClientData, BankData, ChargeItem, BANKS } from "@/types/petition";
import { getCurrentDateFormatted } from "@/utils/formatters";
import { FileText, Download, Eye, User, Building2, Receipt, Scale } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const initialClientData: ClientData = {
  name: "",
  nationality: "brasileiro",
  civilStatus: "",
  profession: "",
  cpf: "",
  rg: "",
  rgIssuer: "SSP/AM",
  street: "",
  number: "",
  neighborhood: "",
  cep: "",
  city: "Manaus",
  state: "AM",
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [showPreview, setShowPreview] = useState(false);

  const [clientData, setClientData] = useState<ClientData>(initialClientData);
  const [bankData, setBankData] = useState<BankData>(BANKS[0]);
  const [petitionType, setPetitionType] = useState<PetitionData["petitionType"]>("TARIFAS_INDEVIDAS");
  const [chargeDescription, setChargeDescription] = useState("PACOTE DE SERVIÇO PADRONIZADO PRIORITÁRIOS I");
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [moralDamage, setMoralDamage] = useState(20000);
  const [wastedTimeDamage, setWastedTimeDamage] = useState(2000);

  const petitionData: PetitionData = {
    client: clientData,
    bank: bankData,
    petitionType,
    chargeDescription,
    charges,
    moralDamage,
    wastedTimeDamage,
    dateOfPetition: getCurrentDateFormatted(),
  };

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById("petition-content");
      if (!element) {
        toast({
          title: "Erro",
          description: "Conteúdo da petição não encontrado",
          variant: "destructive",
        });
        return;
      }

      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `peticao_${clientData.name || "cliente"}_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: "PDF Gerado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente ou use a impressão do navegador.",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "client", label: "Autor", icon: User },
    { id: "bank", label: "Requerido", icon: Building2 },
    { id: "charges", label: "Valores", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-navy-light flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">Gerador de Petições</h1>
                <p className="text-xs text-muted-foreground">Sena Advocacia</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden md:flex"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Ocultar Preview" : "Visualizar"}
              </Button>
              <Button variant="gold" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-3xl mx-auto"}`}>
          {/* Form Section */}
          <div className="space-y-6">
            <Card className="p-6 shadow-soft">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="client">
                  <ClientForm data={clientData} onChange={setClientData} />
                </TabsContent>

                <TabsContent value="bank">
                  <BankForm data={bankData} onChange={setBankData} />
                </TabsContent>

                <TabsContent value="charges">
                  <ChargesForm
                    petitionType={petitionType}
                    chargeDescription={chargeDescription}
                    charges={charges}
                    moralDamage={moralDamage}
                    wastedTimeDamage={wastedTimeDamage}
                    onPetitionTypeChange={setPetitionType}
                    onChargeDescriptionChange={setChargeDescription}
                    onChargesChange={setCharges}
                    onMoralDamageChange={setMoralDamage}
                    onWastedTimeDamageChange={setWastedTimeDamage}
                  />
                </TabsContent>
              </Tabs>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1].id);
                    }
                  }}
                  disabled={activeTab === "client"}
                >
                  Anterior
                </Button>

                {activeTab !== "charges" ? (
                  <Button
                    onClick={() => {
                      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1].id);
                      }
                    }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button variant="gold" onClick={() => setShowPreview(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Petição
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
              <Card className="h-full overflow-hidden shadow-medium">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="font-heading font-semibold">Preview da Petição</h2>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)} className="lg:hidden">
                    Fechar
                  </Button>
                </div>
                <PetitionPreview data={petitionData} />
              </Card>
            </div>
          )}
        </div>

        {/* Mobile Preview Toggle */}
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            size="lg"
            variant="gold"
            className="rounded-full shadow-strong"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-5 h-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
