import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { BookDesignSelectionDto } from './journey-book-design.dto';
import { JourneyBookDesignService } from './journey-book-design.service';
import { Body, Controller, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { bookDesignDraftResponseSchema, bookDesignSelectionResponseSchema } from '@trek/shared';

/**
 * `/api/journeys/:journeyId/book-designs`: the assistant's whole-book design
 * drafts as the Studio's proposal card reads and narrows them. The draft
 * (the designed book, its plan, the pages chosen for the apply) is its
 * maker's alone; any other user, and a draft that is gone, get 410. The
 * journey's own access applies first (404). Choosing pages changes only the
 * draft, so it takes the book's edit rights (403 for a viewer); the apply
 * itself is the held `apply_book_design` the person approves in the chat.
 */
@Controller('api/journeys/:journeyId/book-designs')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
export class JourneyBookDesignController {
  constructor(private readonly designs: JourneyBookDesignService) {}

  @Get(':designId')
  @ResponseContract(bookDesignDraftResponseSchema)
  async draft(@CurrentUser() user: User, @Param('journeyId') journeyId: string, @Param('designId') designId: string) {
    return this.designs.draftView(Number(journeyId), user.id, designId);
  }

  @Put(':designId/selection')
  @HttpCode(200)
  @ResponseContract(bookDesignSelectionResponseSchema)
  async select(
    @CurrentUser() user: User,
    @Param('journeyId') journeyId: string,
    @Param('designId') designId: string,
    @Body() body: BookDesignSelectionDto,
  ) {
    return this.designs.select(Number(journeyId), user.id, designId, body.spreadIds);
  }
}
