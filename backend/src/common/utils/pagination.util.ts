export interface PaginationOptions {
    page: number;
    limit: number;
  }
  
  export function calculatePagination(
    total: number,
    page: number,
    limit: number,
  ): { totalPages: number; offset: number } {
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    return { totalPages, offset };
  }
  