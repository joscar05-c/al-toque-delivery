'use client';

import { useState } from 'react';
import CategoryRow from './CategoryRow';
import CategoryEditModal, { CategoryItem } from './CategoryEditModal';

interface CategoryListProps {
  categories: CategoryItem[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  return (
    <>
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>ID</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      color: 'var(--ink-muted)',
                      fontSize: '14px',
                    }}
                  >
                    No hay categorías registradas. Crea una nueva usando el botón superior.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onEdit={() => setEditingCategory(cat)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </>
  );
}
