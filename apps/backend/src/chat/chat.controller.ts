import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── THREADS ──────────────────────────────────────────────

  @Get('threads')
  getThreads() {
    return this.chatService.getThreads();
  }

  @Get('threads/:id')
  getThread(@Param('id') id: string) {
    return this.chatService.getThread(id);
  }

  @Post('threads')
  createThread(@Body() body: { title?: string }) {
    return this.chatService.createThread(body.title);
  }

  @Delete('threads/:id')
  deleteThread(@Param('id') id: string) {
    return this.chatService.deleteThread(id);
  }

  // ─── MENSAGENS ────────────────────────────────────────────

  @Post('threads/:threadId/messages')
  sendMessage(
    @Param('threadId') threadId: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.sendMessage(threadId, body.content);
  }
}