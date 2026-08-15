import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async create(params: { email: string; passwordHash: string; name: string; roles: Role[] }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        roles: {
          create: params.roles.map((role) => ({ role })),
        },
        // Auto-provision the profile rows a designer/printer-owner needs.
        // Without this, a DESIGNER can register but can't upload a model
        // yet because models_3d requires a DesignerProfile row to exist.
        designerProfile: params.roles.includes(Role.DESIGNER)
          ? { create: {} }
          : undefined,
        printerProfile: params.roles.includes(Role.PRINTER_OWNER)
          ? { create: {} }
          : undefined,
      },
      include: { roles: true },
    });
  }
}