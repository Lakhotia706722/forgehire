import { Client } from 'typesense';
import { getEnv } from './env';

let client: Client;

export function getTypesenseClient(): Client {
  if (!client) {
    const env = getEnv();
    client = new Client({
      nodes: [
        {
          host: env.TYPESENSE_HOST,
          port: env.TYPESENSE_PORT,
          protocol: env.TYPESENSE_PROTOCOL
        }
      ],
      apiKey: env.TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 2
    });
  }
  return client;
}

export async function initializeTypesenseCollections(): Promise<void> {
  const typesense = getTypesenseClient();

  const engineerSchema = {
    name: 'engineer_profiles',
    fields: [
      { name: 'id', type: 'string' as const },
      { name: 'userId', type: 'string' as const },
      { name: 'fullName', type: 'string' as const },
      { name: 'bio', type: 'string' as const, optional: true },
      { name: 'location', type: 'string' as const, optional: true, facet: true },
      { name: 'skills', type: 'string[]' as const, facet: true },
      { name: 'neuronScore', type: 'int32' as const, facet: true },
      { name: 'neuronTier', type: 'string' as const, facet: true },
      { name: 'availabilityStatus', type: 'string' as const, facet: true },
      { name: 'hourlyRate', type: 'float' as const, optional: true },
      { name: 'yearsOfExperience', type: 'int32' as const, optional: true },
      { name: 'completenessScore', type: 'int32' as const },
      { name: 'createdAt', type: 'int64' as const }
    ],
    default_sorting_field: 'neuronScore'
  };

  const companySchema = {
    name: 'company_profiles',
    fields: [
      { name: 'id', type: 'string' as const },
      { name: 'userId', type: 'string' as const },
      { name: 'companyName', type: 'string' as const },
      { name: 'description', type: 'string' as const, optional: true },
      { name: 'industry', type: 'string' as const, optional: true, facet: true },
      { name: 'location', type: 'string' as const, optional: true, facet: true },
      { name: 'trustScore', type: 'int32' as const, facet: true },
      { name: 'isHiring', type: 'bool' as const, facet: true },
      { name: 'hiringIntents', type: 'string[]' as const, facet: true },
      { name: 'aiRequirements', type: 'string[]' as const, facet: true },
      { name: 'createdAt', type: 'int64' as const }
    ],
    default_sorting_field: 'trustScore'
  };

  try {
    try {
      await typesense.collections().create(engineerSchema);
      console.log('✅ Typesense engineer_profiles collection created');
    } catch (error: any) {
      if (error.httpStatus !== 409) throw error;
      console.log('ℹ️  Typesense engineer_profiles collection already exists');
    }

    try {
      await typesense.collections().create(companySchema);
      console.log('✅ Typesense company_profiles collection created');
    } catch (error: any) {
      if (error.httpStatus !== 409) throw error;
      console.log('ℹ️  Typesense company_profiles collection already exists');
    }
  } catch (error) {
    console.error('❌ Typesense initialization failed:', error);
    throw error;
  }
}
