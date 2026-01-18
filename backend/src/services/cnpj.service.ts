import axios from 'axios';

/**
 * CNPJ Lookup Service
 * Uses BrasilAPI to fetch company data from Receita Federal
 */

interface CNPJData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
}

interface CNPJResponse {
    companyName: string;
    tradeName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
}

class CNPJService {
    private readonly apiUrl = 'https://brasilapi.com.br/api/cnpj/v1';

    /**
     * Lookup company data by CNPJ
     */
    async lookup(cnpj: string): Promise<CNPJResponse> {
        try {
            // Remove formatting from CNPJ
            const cleanCNPJ = cnpj.replace(/\D/g, '');

            if (cleanCNPJ.length !== 14) {
                throw new Error('CNPJ inválido');
            }

            console.log(`Looking up CNPJ: ${cleanCNPJ}`);

            const response = await axios.get<CNPJData>(`${this.apiUrl}/${cleanCNPJ}`, {
                timeout: 10000, // 10 seconds timeout
            });

            const data = response.data;

            // Format address
            const addressParts = [
                data.logradouro,
                data.numero,
                data.complemento,
                data.bairro,
            ].filter(Boolean);

            return {
                companyName: data.razao_social || data.nome_fantasia,
                tradeName: data.nome_fantasia,
                address: addressParts.join(', '),
                city: data.municipio,
                state: data.uf,
                zipCode: data.cep.replace(/\D/g, ''),
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('CNPJ não encontrado');
            }
            if (error.response?.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
            }
            console.error('CNPJ lookup error:', error);
            throw new Error('Erro ao consultar CNPJ');
        }
    }

    /**
     * Validate CNPJ format and check digits
     */
    validate(cnpj: string): boolean {
        const cleanCNPJ = cnpj.replace(/\D/g, '');

        if (cleanCNPJ.length !== 14) {
            return false;
        }

        // Check if all digits are the same
        if (/^(\d)\1+$/.test(cleanCNPJ)) {
            return false;
        }

        // Validate check digits
        let sum = 0;
        let factor = 5;

        // First check digit
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleanCNPJ[i]) * factor;
            factor = factor === 2 ? 9 : factor - 1;
        }

        let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (checkDigit !== parseInt(cleanCNPJ[12])) {
            return false;
        }

        // Second check digit
        sum = 0;
        factor = 6;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleanCNPJ[i]) * factor;
            factor = factor === 2 ? 9 : factor - 1;
        }

        checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return checkDigit === parseInt(cleanCNPJ[13]);
    }
}

export const cnpjService = new CNPJService();
