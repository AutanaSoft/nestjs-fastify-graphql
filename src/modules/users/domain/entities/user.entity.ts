import { HashUtils } from '@shared/applications/utils/hash.utils';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../enums/user.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  @Index({ unique: true })
  email: string;

  @Column({ name: 'user_name', length: 20 })
  @Index({ unique: true })
  userName: string;

  @Column({ length: 64 })
  password: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.REGISTERED })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await HashUtils.hashPassword(this.password);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return await HashUtils.comparePassword(password, this.password);
  }
}
