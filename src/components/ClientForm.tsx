import { ClientData, CIVIL_STATUS_OPTIONS, BRAZILIAN_STATES } from "@/types/petition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCPF } from "@/utils/formatters";
import { User } from "lucide-react";

interface ClientFormProps {
  data: ClientData;
  onChange: (data: ClientData) => void;
}

export function ClientForm({ data, onChange }: ClientFormProps) {
  const updateField = (field: keyof ClientData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    updateField('cpf', formatted);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Dados do Autor</h3>
          <p className="text-sm text-muted-foreground">Informações pessoais do cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value.toUpperCase())}
            placeholder="FULANO DE TAL"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="nationality">Nacionalidade</Label>
          <Input
            id="nationality"
            value={data.nationality}
            onChange={(e) => updateField('nationality', e.target.value.toLowerCase())}
            placeholder="brasileiro"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="civilStatus">Estado Civil</Label>
          <Select value={data.civilStatus} onValueChange={(v) => updateField('civilStatus', v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {CIVIL_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status.toLowerCase()}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="profession">Profissão</Label>
          <Input
            id="profession"
            value={data.profession}
            onChange={(e) => updateField('profession', e.target.value.toLowerCase())}
            placeholder="aposentado"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={data.cpf}
            onChange={(e) => handleCPFChange(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="rg">RG</Label>
          <Input
            id="rg"
            value={data.rg}
            onChange={(e) => updateField('rg', e.target.value)}
            placeholder="0000000"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="rgIssuer">Órgão Emissor</Label>
          <Input
            id="rgIssuer"
            value={data.rgIssuer}
            onChange={(e) => updateField('rgIssuer', e.target.value.toUpperCase())}
            placeholder="SSP/AM"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="section-divider my-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="street">Endereço</Label>
          <Input
            id="street"
            value={data.street}
            onChange={(e) => updateField('street', e.target.value)}
            placeholder="Rua / Avenida"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={data.number}
            onChange={(e) => updateField('number', e.target.value)}
            placeholder="123"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={data.neighborhood}
            onChange={(e) => updateField('neighborhood', e.target.value)}
            placeholder="Centro"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={data.cep}
            onChange={(e) => updateField('cep', e.target.value)}
            placeholder="00000-000"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Manaus"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="state">Estado</Label>
          <Select value={data.state} onValueChange={(v) => updateField('state', v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
