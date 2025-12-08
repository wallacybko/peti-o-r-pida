export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCurrencyExtended(value: number): string {
  const formatted = formatCurrency(value);
  const extenso = numberToWords(value);
  return `${formatted} (${extenso})`;
}

export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

export function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function numberToWords(value: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (value === 0) return 'zero reais';
  if (value === 100) return 'cem reais';

  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);

  let result = '';

  // Thousands
  if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    if (thousands === 1) {
      result += 'mil';
    } else if (thousands < 10) {
      result += units[thousands] + ' mil';
    } else if (thousands < 20) {
      result += teens[thousands - 10] + ' mil';
    } else {
      const t = Math.floor(thousands / 10);
      const u = thousands % 10;
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
      result += ' mil';
    }
  }

  // Hundreds
  const remainder = intPart % 1000;
  if (remainder >= 100) {
    if (result) result += ', ';
    const h = Math.floor(remainder / 100);
    if (remainder === 100) {
      result += 'cem';
    } else {
      result += hundreds[h];
    }
  }

  // Tens and units
  const tensAndUnits = remainder % 100;
  if (tensAndUnits > 0) {
    if (remainder >= 100) {
      result += ' e ';
    } else if (result) {
      result += ' e ';
    }
    
    if (tensAndUnits < 10) {
      result += units[tensAndUnits];
    } else if (tensAndUnits < 20) {
      result += teens[tensAndUnits - 10];
    } else {
      const t = Math.floor(tensAndUnits / 10);
      const u = tensAndUnits % 10;
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
    }
  }

  // Reais
  if (intPart === 1) {
    result += ' real';
  } else if (intPart > 0) {
    result += ' reais';
  }

  // Centavos
  if (decPart > 0) {
    if (intPart > 0) result += ' e ';
    if (decPart < 10) {
      result += units[decPart];
    } else if (decPart < 20) {
      result += teens[decPart - 10];
    } else {
      const t = Math.floor(decPart / 10);
      const u = decPart % 10;
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
    }
    result += decPart === 1 ? ' centavo' : ' centavos';
  }

  return result;
}

export function getCurrentDateFormatted(): string {
  return new Date().toISOString().split('T')[0];
}
