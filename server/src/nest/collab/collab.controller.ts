import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../types';
import { CollabService } from './collab.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BLOCKED_EXTENSIONS } from '../../services/fileService';

const MAX_NOTE_FILE_SIZE = 50 * 1024 * 1024;
const filesDir = path.join(__dirname, '../../../uploads/files');
const NOTE_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => { if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true }); cb(null, filesDir); },
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_NOTE_FILE_SIZE },
  defParamCharset: 'utf8', // parity with legacy routes/collab.ts — preserve non-ASCII original filenames
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext) || file.mimetype.includes('svg') || file.mimetype.includes('html') || file.mimetype.includes('javascript')) {
      const err: Error & { statusCode?: number } = new Error('File type not allowed');
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
};

/**
 * /api/trips/:tripId/collab — shared notes, polls, chat (+ reactions), link
 * previews. WebSocket-backed group collaboration.
 *
 * Byte-identical to the legacy Express route (server/src/routes/collab.ts): trip
 * access (404), 'collab_edit' (403) on mutations + 'file_upload' on note files,
 * create 201 / rest 200 (vote + react POST stay 200), the bespoke 400/403/404
 * bodies, the chat/note notifications, and all WebSocket broadcasts with the
 * forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/collab')
@UseGuards(JwtAuthGuard)
export class CollabController {
  constructor(private readonly collab: CollabService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.collab.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: NonNullable<ReturnType<CollabService['verifyTripAccess']>>, user: User): void {
    if (!this.collab.canEdit(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  // ── Notes ───────────────────────────────────────────────────────────────
  @Get('notes')
  listNotes(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { notes: this.collab.listNotes(tripId) };
  }

  @Post('notes')
  createNote(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: { title?: string; content?: string; category?: string; color?: string; website?: string }, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.title) {
      throw new HttpException({ error: 'Title is required' }, 400);
    }
    const note = this.collab.createNote(tripId, user.id, {
      title: body.title,
      content: body.content,
      category: body.category,
      color: body.color,
      website: body.website,
    });
    this.collab.broadcast(tripId, 'collab:note:created', { note }, socketId);
    this.collab.notifyCollab(tripId, user);
    return { note };
  }

  @Put('notes/:id')
  updateNote(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Body() body: { title?: string; content?: string; category?: string; color?: string; pinned?: number | boolean; website?: string }, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const note = this.collab.updateNote(tripId, id, {
      title: body.title,
      content: body.content,
      category: body.category,
      color: body.color,
      pinned: body.pinned,
      website: body.website,
    });
    if (!note) {
      throw new HttpException({ error: 'Note not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:note:updated', { note }, socketId);
    return { note };
  }

  @Delete('notes/:id')
  deleteNote(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.collab.deleteNote(tripId, id)) {
      throw new HttpException({ error: 'Note not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:note:deleted', { noteId: Number(id) }, socketId);
    return { success: true };
  }

  @Post('notes/:id/files')
  @UseInterceptors(FileInterceptor('file', NOTE_UPLOAD))
  addNoteFile(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.collab.canUploadFiles(trip, user)) {
      throw new HttpException({ error: 'No permission to upload files' }, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    const result = this.collab.addNoteFile(tripId, id, file);
    if (!result) {
      throw new HttpException({ error: 'Note not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:note:updated', { note: this.collab.getFormattedNoteById(id) }, socketId);
    return result;
  }

  @Delete('notes/:id/files/:fileId')
  deleteNoteFile(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Param('fileId') fileId: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.collab.deleteNoteFile(id, fileId)) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:note:updated', { note: this.collab.getFormattedNoteById(id) }, socketId);
    return { success: true };
  }

  // ── Polls ───────────────────────────────────────────────────────────────
  @Get('polls')
  listPolls(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { polls: this.collab.listPolls(tripId) };
  }

  @Post('polls')
  createPoll(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: { question?: string; options?: unknown[]; multiple?: boolean; multiple_choice?: boolean; deadline?: string }, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.question) {
      throw new HttpException({ error: 'Question is required' }, 400);
    }
    if (!Array.isArray(body.options) || body.options.length < 2) {
      throw new HttpException({ error: 'At least 2 options are required' }, 400);
    }
    const poll = this.collab.createPoll(tripId, user.id, {
      question: body.question,
      options: body.options,
      multiple: body.multiple,
      multiple_choice: body.multiple_choice,
      deadline: body.deadline,
    });
    this.collab.broadcast(tripId, 'collab:poll:created', { poll }, socketId);
    return { poll };
  }

  @Post('polls/:id/vote')
  @HttpCode(200)
  votePoll(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Body('option_index') optionIndex: number, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const result = this.collab.votePoll(tripId, id, user.id, optionIndex);
    if (result.error === 'not_found') throw new HttpException({ error: 'Poll not found' }, 404);
    if (result.error === 'closed') throw new HttpException({ error: 'Poll is closed' }, 400);
    if (result.error === 'invalid_index') throw new HttpException({ error: 'Invalid option index' }, 400);
    this.collab.broadcast(tripId, 'collab:poll:voted', { poll: result.poll }, socketId);
    return { poll: result.poll };
  }

  @Put('polls/:id/close')
  closePoll(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const poll = this.collab.closePoll(tripId, id);
    if (!poll) {
      throw new HttpException({ error: 'Poll not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:poll:closed', { poll }, socketId);
    return { poll };
  }

  @Delete('polls/:id')
  deletePoll(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.collab.deletePoll(tripId, id)) {
      throw new HttpException({ error: 'Poll not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:poll:deleted', { pollId: Number(id) }, socketId);
    return { success: true };
  }

  // ── Messages ────────────────────────────────────────────────────────────
  @Get('messages')
  listMessages(@CurrentUser() user: User, @Param('tripId') tripId: string, @Query('before') before?: string) {
    this.requireTrip(tripId, user);
    return { messages: this.collab.listMessages(tripId, before) };
  }

  @Post('messages')
  createMessage(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: { text?: string; reply_to?: number | null }, @Headers('x-socket-id') socketId?: string) {
    if (body.text && body.text.length > 5000) {
      throw new HttpException({ error: 'text must be 5000 characters or less' }, 400);
    }
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.text || !body.text.trim()) {
      throw new HttpException({ error: 'Message text is required' }, 400);
    }
    const result = this.collab.createMessage(tripId, user.id, body.text, body.reply_to);
    if (result.error === 'reply_not_found') {
      throw new HttpException({ error: 'Reply target message not found' }, 400);
    }
    this.collab.broadcast(tripId, 'collab:message:created', { message: result.message }, socketId);
    const t = body.text.trim();
    this.collab.notifyCollab(tripId, user, t.length > 80 ? t.substring(0, 80) + '...' : t);
    return { message: result.message };
  }

  @Post('messages/:id/react')
  @HttpCode(200)
  react(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Body('emoji') emoji: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!emoji) {
      throw new HttpException({ error: 'Emoji is required' }, 400);
    }
    const result = this.collab.reactMessage(id, tripId, user.id, emoji);
    if (!result.found) {
      throw new HttpException({ error: 'Message not found' }, 404);
    }
    this.collab.broadcast(tripId, 'collab:message:reacted', { messageId: Number(id), reactions: result.reactions }, socketId);
    return { reactions: result.reactions };
  }

  @Delete('messages/:id')
  deleteMessage(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const result = this.collab.deleteMessage(tripId, id, user.id);
    if (result.error === 'not_found') throw new HttpException({ error: 'Message not found' }, 404);
    if (result.error === 'not_owner') throw new HttpException({ error: 'You can only delete your own messages' }, 403);
    this.collab.broadcast(tripId, 'collab:message:deleted', { messageId: Number(id), username: result.username || user.username }, socketId);
    return { success: true };
  }

  // ── Link preview ──────────────────────────────────────────────────────────
  @Get('link-preview')
  async linkPreview(@CurrentUser() user: User, @Param('tripId') tripId: string, @Query('url') url?: string) {
    // NB: the legacy route does not verify trip access on link-preview; kept 1:1.
    void user; void tripId;
    if (!url) {
      throw new HttpException({ error: 'URL is required' }, 400);
    }
    try {
      const preview = await this.collab.linkPreview(url);
      const asRecord = preview as { error?: string };
      if (asRecord.error) {
        throw new HttpException({ error: asRecord.error }, 400);
      }
      return preview;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      return { title: null, description: null, image: null, url };
    }
  }
}
