import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('conversation_participants')
export class ConversationParticipant {
    @PrimaryColumn('uuid')
    conversationId: string;

    @PrimaryColumn('uuid')
    userId: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants)
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastReadAt: Date;
}
