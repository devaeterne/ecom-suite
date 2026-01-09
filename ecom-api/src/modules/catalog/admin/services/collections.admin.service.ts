import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { CollectionRepository } from "@/modules/catalog/collections/common/prisma/collection.repo";
import {
  AdminCreateCollectionDto,
  AdminListCollectionsQueryDto,
  AdminUpdateCollectionDto,
} from "@/modules/catalog/admin/dto/admin.collection.dto";
import {
  CollectionDto,
  CollectionListDto,
} from "@/modules/catalog/collections/common/dto/collection.dto";
import { toCollectionDto } from "@/modules/catalog/collections/common/mappers/collection.mapper";

function isPrismaUniqueError(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

@Injectable()
export class CollectionsAdminService {
  constructor(private readonly repo: CollectionRepository) {}

  async create(
    tenantId: string,
    dto: AdminCreateCollectionDto
  ): Promise<CollectionDto> {
    try {
      const created = await this.repo.create({
        tenantId,
        data: {
          title: dto.title.trim(),
          handle: dto.handle.trim(),
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue, // ✅
        },
      });
      return toCollectionDto(created);
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        // tenantId + handle unique
        throw new ConflictException("Collection handle already exists.");
      }
      throw e;
    }
  }

  async list(
    tenantId: string,
    q: AdminListCollectionsQueryDto
  ): Promise<CollectionListDto> {
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 20;

    const { items, total } = await this.repo.findMany({
      tenantId,
      q: q.q?.trim(),
      offset,
      limit,
    });

    return {
      items: items.map(toCollectionDto),
      total,
      offset,
      limit,
    };
  }

  async getById(tenantId: string, id: string): Promise<CollectionDto> {
    const found = await this.repo.findById({ tenantId, id });
    if (!found) throw new NotFoundException("Collection not found.");
    return toCollectionDto(found);
  }

  async update(
    tenantId: string,
    id: string,
    dto: AdminUpdateCollectionDto
  ): Promise<CollectionDto> {
    // not found check (clean error)
    const exists = await this.repo.findById({ tenantId, id });
    if (!exists) throw new NotFoundException("Collection not found.");

    try {
      const updated = await this.repo.update({
        tenantId,
        id,
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.handle !== undefined ? { handle: dto.handle.trim() } : {}),
          ...(dto.metadata !== undefined
            ? { metadata: dto.metadata as Prisma.InputJsonValue } // ✅
            : {}),
        },
      });
      return toCollectionDto(updated);
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        throw new ConflictException("Collection handle already exists.");
      }
      throw e;
    }
  }

  async delete(tenantId: string, id: string): Promise<{ ok: true }> {
    // onDelete: Cascade zaten linkleri temizliyor
    const exists = await this.repo.findById({ tenantId, id });
    if (!exists) throw new NotFoundException("Collection not found.");

    await this.repo.delete({ tenantId, id });
    return { ok: true };
  }
}
