import axios from 'axios';

/**
 * CEP Lookup Service
 * Uses BrasilAPI to fetch address data from CEP
 */

interface CEPData {
    cep: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
}

interface CEPResponse {
    zipCode: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
}

class CEPService {
    private readonly apiUrl = 'https://brasilapi.com.br/api/cep/v1';

    /**
     * Lookup address by CEP
     */
    async lookup(cep: string): Promise<CEPResponse> {
        try {
            // Remove formatting from CEP
            const cleanCEP = cep.replace(/\D/g, '');

            if (cleanCEP.length !== 8) {
                throw new Error('CEP inválido');
            }

            console.log(`Looking up CEP: ${cleanCEP}`);

            const response = await axios.get<CEPData>(`${this.apiUrl}/${cleanCEP}`, {
                timeout: 10000, // 10 seconds timeout
            });

            const data = response.data;

            return {
                zipCode: data.cep.replace(/\D/g, ''),
                street: data.street,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('CEP não encontrado');
            }
            if (error.response?.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
            }
            console.error('CEP lookup error:', error);
            throw new Error('Erro ao consultar CEP');
        }
    }

    /**
     * Validate CEP format
     */
    validate(cep: string): boolean {
        const cleanCEP = cep.replace(/\D/g, '');
        return cleanCEP.length === 8 && /^\d+$/.test(cleanCEP);
    }
}

export const cepService = new CEPService();
