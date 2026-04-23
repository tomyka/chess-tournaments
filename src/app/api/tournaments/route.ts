import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeControl = searchParams.get("timeControl");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateStart = searchParams.get("dateStart");
    const dateEnd = searchParams.get("dateEnd");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (timeControl && timeControl !== "ALL") {
      where.timeControl = timeControl;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    // Build AND conditions
    const andConditions: Record<string, unknown>[] = [];
    
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Date range filtering - include tournaments with null startDate
    if (dateStart || dateEnd) {
      const filterRange: Record<string, unknown> = {};
      if (dateStart) {
        filterRange.gte = new Date(dateStart);
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999);
        filterRange.lte = endDate;
      }
      andConditions.push({
        OR: [
          { startDate: filterRange },
          { startDate: null }
        ],
      });
    }

    // Combine all AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        orderBy: [
          { status: "asc" },
          { startDate: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    return NextResponse.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
