import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { ConversationParticipant } from './conversation-participant.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column({ default: false })
    isGroup: boolean;

    @Column({ type: 'uuid', nullable: true })
    lastMessageId: string;

    @ManyToOne(() => Message)
    @JoinColumn({ name: 'lastMessageId' })
    lastMessage: Message;

    @OneToMany(() => ConversationParticipant, (participant) => participant.conversation)
    participants: ConversationParticipant[];

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
