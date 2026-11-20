import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── THREADS ──────────────────────────────────────────────

  @Get('threads')
  getThreads(@CurrentUser() user: ZenithUser) {
    return this.chatService.getThreads(user.id);
  }

  @Get('threads/:id')
  getThread(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.chatService.getThread(user.id, id);
  }

  @Post('threads')
  createThread(@CurrentUser() user: ZenithUser, @Body() body: { title?: string }) {
    return this.chatService.createThread(user.id, body.title);
  }

  @Delete('threads/:id')
  deleteThread(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.chatService.deleteThread(user.id, id);
  }

  // ─── MENSAGENS ────────────────────────────────────────────

  @Post('threads/:threadId/messages')
  sendMessage(
    @CurrentUser() user: ZenithUser,
    @Param('threadId') threadId: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.sendMessage(user.id, threadId, body.content);
  }
}
