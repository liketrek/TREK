import { Module } from '@nestjs/common';
import { LlmParseService } from './llm-parse.service';
import { LlmLocalService } from './llm-local.service';
import { LlmLocalController } from './llm-local.controller';

/** Provides the LLM booking-import fallback; imported by BookingImportModule. */
@Module({
  controllers: [LlmLocalController],
  providers: [LlmParseService, LlmLocalService],
  exports: [LlmParseService],
})
export class LlmParseModule {}
