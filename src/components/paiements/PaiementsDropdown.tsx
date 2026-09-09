import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { DeleteType } from './PaiementsUtils';
import { useTheme } from '../../contexts/ThemeContext';

interface DropdownProps {
  id: number;
  type: DeleteType;
  data: any;
  onView?: (data: any) => void;
  onEdit?: (data: any) => void;
  onDelete: (id: number, type: string) => void;
  onViewHistorique?: (id: number) => void;
  onOpenChange?: (open: boolean) => void;
}

const EllipsisDropdown: React.FC<DropdownProps> = ({
  id, type, data, onView, onEdit, onDelete, onViewHistorique, onOpenChange,
}) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => onOpenChange?.(false), 0);
  }, [onOpenChange]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const MENU_WIDTH = 205, MENU_HEIGHT = 150, gap = 6, margin = 10;
    let left = rect.right - MENU_WIDTH, top = rect.bottom + gap;
    if (left + MENU_WIDTH > window.innerWidth - margin) left = window.innerWidth - MENU_WIDTH - margin;
    if (left < margin) left = margin;
    if (top + MENU_HEIGHT > window.innerHeight - margin) top = rect.top - MENU_HEIGHT - gap;
    if (top < margin) top = margin;
    setPosition({ top, left });
  }, []);

  const toggle = useCallback(() => {
    setOpen(current => {
      const next = !current;
      setTimeout(() => onOpenChange?.(next), 0);
      return next;
    });
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const timer = window.setTimeout(updatePosition, 30);
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, close]);

  const action = (event: React.MouseEvent, typeAction: 'view' | 'edit' | 'delete') => {
    event.preventDefault();
    event.stopPropagation();
    close();
    window.requestAnimationFrame(() => {
      if (typeAction === 'view') {
        if (type === 'employe' && onViewHistorique) { onViewHistorique(data.id); return; }
        onView?.(data);
        return;
      }
      if (typeAction === 'edit') { onEdit?.(data); return; }
      onDelete(id, type);
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[99998]" onMouseDown={(e) => { e.preventDefault(); close(); }} />
          <div
            ref={menuRef}
            className={`fixed z-[99999] w-[205px] overflow-hidden rounded-xl border py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${
              isDark ? 'border-white/[0.10] bg-[#0F172A]' : 'border-slate-200 bg-white'
            }`}
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => action(e, 'view')}
              className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <Eye size={16} className="mr-3 shrink-0 text-slate-500 dark:text-slate-400" /> Voir les détails
            </button>
            <button
              type="button"
              onClick={(e) => action(e, 'edit')}
              className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <Edit size={16} className="mr-3 shrink-0 text-slate-500 dark:text-slate-400" /> Modifier
            </button>
            <div className={`my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`} />
            <button
              type="button"
              onClick={(e) => action(e, 'delete')}
              className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-300"
            >
              <Trash2 size={16} className="mr-3 shrink-0" /> Supprimer
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default EllipsisDropdown;