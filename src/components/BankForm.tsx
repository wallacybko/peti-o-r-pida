import { BankData, BANKS } from "@/types/petition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface BankFormProps {
  data: BankData;
  onChange: (data: BankData) => void;
}

export function BankForm({ data, onChange }: BankFormProps) {
  const handleBankSelect = (bankName: string) => {
    if (bankName === 'custom') {
      onChange({
        name: '',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        cep: '',
      });
    } else {
      const bank = BANKS.find(b => b.name === bankName);
      if (bank) {
        onChange(bank);
      }
    }
  };

  const updateField = (field: keyof BankData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isPresetBank = BANKS.some(b => b.name === data.name);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Dados do Requerido</h3>
          <p className="text-sm text-muted-foreground">Instituição financeira</p>
        </div>
      </div>

      <div>
        <Label>Selecionar Banco</Label>
        <Select 
          value={isPresetBank ? data.name : 'custom'} 
          onValueChange={handleBankSelect}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Selecione o banco" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((bank) => (
              <SelectItem key={bank.cnpj} value={bank.name}>
                {bank.name}
              </SelectItem>
            ))}
            <SelectItem value="custom">Outro (preencher manualmente)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="section-divider" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="bankName">Nome da Instituição</Label>
          <Input
            id="bankName"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value.toUpperCase())}
            placeholder="BANCO EXEMPLO S/A"
            className="mt-1.5"
            disabled={isPresetBank}
          />
        </div>

        <div>
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={data.cnpj}
            onChange={(e) => updateField('cnpj', e.target.value)}
            placeholder="00.000.000/0001-00"
            className="mt-1.5"
            disabled={isPresetBank}
          />
        </div>

        <div>
          <Label htmlFor="bankAddress">Endereço</Label>
          <Input
            id="bankAddress"
            value={data.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Endereço completo"
            className="mt-1.5"
            disabled={isPresetBank}
          />
        </div>

        <div>
          <Label htmlFor="bankCity">Cidade</Label>
          <Input
            id="bankCity"
            value={data.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Cidade"
            className="mt-1.5"
            disabled={isPresetBank}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankState">Estado</Label>
            <Input
              id="bankState"
              value={data.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="UF"
              className="mt-1.5"
              disabled={isPresetBank}
            />
          </div>
          <div>
            <Label htmlFor="bankCep">CEP</Label>
            <Input
              id="bankCep"
              value={data.cep}
              onChange={(e) => updateField('cep', e.target.value)}
              placeholder="00000-000"
              className="mt-1.5"
              disabled={isPresetBank}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
