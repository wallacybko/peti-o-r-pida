// Função completa para converter números para extenso em português brasileiro

const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'cem';
  
  let result = '';
  
  // Hundreds
  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)];
    num %= 100;
    if (num > 0) result += ' e ';
  }
  
  // Tens and units
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += ' e ';
  } else if (num >= 10) {
    result += teens[num - 10];
    return result;
  }
  
  if (num > 0) {
    result += units[num];
  }
  
  return result;
}

function convertThousands(num: number): string {
  if (num === 0) return '';
  
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  
  let result = '';
  
  if (thousands > 0) {
    if (thousands === 1) {
      result = 'mil';
    } else {
      result = convertHundreds(thousands) + ' mil';
    }
    
    if (remainder > 0) {
      // Use "e" when remainder < 100 or when remainder is exact hundred
      if (remainder < 100 || remainder % 100 === 0) {
        result += ' e ';
      } else {
        result += ', ';
      }
    }
  }
  
  if (remainder > 0) {
    result += convertHundreds(remainder);
  }
  
  return result;
}

function convertMillions(num: number): string {
  if (num === 0) return '';
  
  const millions = Math.floor(num / 1000000);
  const remainder = num % 1000000;
  
  let result = '';
  
  if (millions > 0) {
    if (millions === 1) {
      result = 'um milhão';
    } else {
      result = convertThousands(millions) + ' milhões';
    }
    
    if (remainder > 0) {
      if (remainder < 1000 && remainder % 100 === 0) {
        result += ' e ';
      } else if (remainder < 100) {
        result += ' e ';
      } else {
        result += ', ';
      }
    }
  }
  
  if (remainder > 0) {
    result += convertThousands(remainder);
  }
  
  return result;
}

export function numberToWordsComplete(value: number): string {
  if (value === 0) return 'zero reais';
  
  const intPart = Math.floor(Math.abs(value));
  const decPart = Math.round((Math.abs(value) - intPart) * 100);
  
  let result = '';
  
  // Convert integer part
  if (intPart > 0) {
    if (intPart >= 1000000) {
      result = convertMillions(intPart);
    } else if (intPart >= 1000) {
      result = convertThousands(intPart);
    } else {
      result = convertHundreds(intPart);
    }
    
    // Add "reais" or "real"
    if (intPart === 1) {
      result += ' real';
    } else {
      result += ' reais';
    }
  }
  
  // Convert decimal part (centavos)
  if (decPart > 0) {
    if (intPart > 0) {
      result += ' e ';
    }
    
    if (decPart >= 20) {
      result += tens[Math.floor(decPart / 10)];
      if (decPart % 10 > 0) {
        result += ' e ' + units[decPart % 10];
      }
    } else if (decPart >= 10) {
      result += teens[decPart - 10];
    } else {
      result += units[decPart];
    }
    
    if (decPart === 1) {
      result += ' centavo';
    } else {
      result += ' centavos';
    }
  }
  
  return result;
}

// Alias for backwards compatibility
export const numberToWords = numberToWordsComplete;
