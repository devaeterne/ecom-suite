import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { TagRepository } from "@/modules/catalog/tags/common/prisma/tag.repo";
import {
  AdminCreateTagDto,
  AdminListTagsQueryDto,
  AdminUpdateTagDto,
} from "@/modules/catalog/admin/dto/admin.product.tag.dto";
import { toTagDto } from "@/modules/catalog/tags/common/mappers/tag.mapper";

function isPrismaUniqueError(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

@Injectable()
export class TagsAdminService {
  constructor(private readonly repo: TagRepository) {}

  async create(tenantId: string, dto: AdminCreateTagDto) {
    try {
      const created = await this.repo.create({
        tenantId,
        data: {
          value: dto.value.trim(),
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
      return toTagDto(created);
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        // @@unique([tenantId, value])
        throw new ConflictException("Tag value already exists.");
      }
      throw e;
    }
  }

  async list(tenantId: string, q: AdminListTagsQueryDto) {
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 50;

    const { items, total } = await this.repo.findMany({
      tenantId,
      q: q.q?.trim(),
      offset,
      limit,
    });

    return { items: items.map(toTagDto), total, offset, limit };
  }

  async getById(tenantId: string, id: string) {
    const found = await this.repo.findById({ tenantId, id });
    if (!found) throw new NotFoundException("Tag not found.");
    return toTagDto(found);
  }

  async update(tenantId: string, id: string, dto: AdminUpdateTagDto) {
    const exists = await this.repo.findById({ tenantId, id });
    if (!exists) throw new NotFoundException("Tag not found.");

    try {
      const updated = await this.repo.update({
        tenantId,
        id,
        data: {
          ...(dto.value !== undefined ? { value: dto.value.trim() } : {}),
          ...(dto.metadata !== undefined
            ? { metadata: dto.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });
      return toTagDto(updated);
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        throw new ConflictException("Tag value already exists.");
      }
      throw e;
    }
  }

  async delete(tenantId: string, id: string) {
    const exists = await this.repo.findById({ tenantId, id });
    if (!exists) throw new NotFoundException("Tag not found.");

    await this.repo.delete({ tenantId, id });
    return { ok: true };
  }
}
