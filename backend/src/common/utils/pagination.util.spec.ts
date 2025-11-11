// src/common/utils/pagination.util.spec.ts
import { calculatePagination } from './pagination.util';

describe('pagination.util', () => {
  it('should compute totalPages and offset', () => {
    expect(calculatePagination(100, 1, 10)).toEqual({ totalPages: 10, offset: 0 });
    expect(calculatePagination(95, 3, 20)).toEqual({ totalPages: 5, offset: 40 });
  });
});
