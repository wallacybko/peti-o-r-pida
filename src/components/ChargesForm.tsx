import { ChargeItem, PetitionType, PETITION_TYPE_LABELS } from "@/types/petition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatCurrencyExtended } from "@/utils/formatters";
import { Plus, Trash2, Receipt, Calculator } from "lucide-react";

interface ChargesFormProps {
  petitionType: PetitionType;
  chargeDescription: string;
  charges: ChargeItem[];
  moralDamage: number;
  wastedTimeDamage: number;
  onPetitionTypeChange: (type: PetitionType) => void;
  onChargeDescriptionChange: (desc: string) => void;
  onChargesChange: (charges: ChargeItem[]) => void;
  onMoralDamageChange: (value: number) => void;
  onWastedTimeDamageChange: (value: number) => void;
}

export function ChargesForm({
  petitionType,
  chargeDescription,
  charges,
  moralDamage,
  wastedTimeDamage,
  onPetitionTypeChange,
  onChargeDescriptionChange,
  onChargesChange,
  onMoralDamageChange,
  onWastedTimeDamageChange,
}: ChargesFormProps) {
  const addCharge = () => {
    const newCharge: ChargeItem = {
      id: crypto.randomUUID(),
      date: '',
      description: chargeDescription || PETITION_TYPE_LABELS[petitionType],
      value: 0,
    };
    onChargesChange([...charges, newCharge]);
  };

  const updateCharge = (id: string, field: keyof ChargeItem, value: string | number) => {
    onChargesChange(
      charges.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCharge = (id: string) => {
    onChargesChange(charges.filter((c) => c.id !== id));
  };

  const totalCharges = charges.reduce((sum, c) => sum + c.value, 0);
  const materialDamage = totalCharges * 2; // Repetição do indébito em dobro
  const totalValue = materialDamage + moralDamage + wastedTimeDamage;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Cobranças Indevidas</h3>
          <p className="text-sm text-muted-foreground">Valores descontados e indenizações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Ação</Label>
          <Select value={petitionType} onValueChange={(v) => onPetitionTypeChange(v as PetitionType)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PETITION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Descrição da Cobrança</Label>
          <Input
            value={chargeDescription}
            onChange={(e) => onChargeDescriptionChange(e.target.value)}
            placeholder="PACOTE DE SERVIÇO PADRONIZADO..."
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="section-divider" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Lançamentos Indevidos</Label>
          <Button onClick={addCharge} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {charges.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum lançamento adicionado</p>
            <p className="text-sm text-muted-foreground/70">Clique em "Adicionar" para incluir cobranças</p>
          </div>
        ) : (
          <div className="space-y-3">
            {charges.map((charge, index) => (
              <div
                key={charge.id}
                className="grid grid-cols-12 gap-3 items-end p-3 bg-secondary/30 rounded-lg"
              >
                <div className="col-span-2">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={charge.date}
                    onChange={(e) => updateCharge(charge.id, 'date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-6">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={charge.description}
                    onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.value || ''}
                    onChange={(e) => updateCharge(charge.id, 'value', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCharge(charge.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-divider" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Dano Moral (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={moralDamage || ''}
            onChange={(e) => onMoralDamageChange(parseFloat(e.target.value) || 0)}
            placeholder="20000.00"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Tempo Desperdiçado (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={wastedTimeDamage || ''}
            onChange={(e) => onWastedTimeDamageChange(parseFloat(e.target.value) || 0)}
            placeholder="2000.00"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="section-divider" />

      {/* Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h4 className="font-heading font-semibold text-primary">Resumo dos Valores</h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total das cobranças:</span>
            <span>{formatCurrency(totalCharges)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Repetição do indébito (2x):</span>
            <span className="font-medium">{formatCurrency(materialDamage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dano moral:</span>
            <span>{formatCurrency(moralDamage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tempo desperdiçado:</span>
            <span>{formatCurrency(wastedTimeDamage)}</span>
          </div>
          <div className="section-divider my-3" />
          <div className="flex justify-between text-base font-semibold text-primary">
            <span>VALOR DA CAUSA:</span>
            <span>{formatCurrencyExtended(totalValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
