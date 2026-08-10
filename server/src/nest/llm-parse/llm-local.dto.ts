import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * The Ollama pull body. Both fields are optional because the service supplies
 * its own defaults for a missing baseUrl and reports an empty model itself.
 */
export class LlmLocalPullDto extends createZodDto(
  z.looseObject({ baseUrl: z.string().optional(), model: z.string().optional() }),
) {}
