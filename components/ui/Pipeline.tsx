import * as React from 'react';
import { Icon } from './Icon';
import { PIPELINE_STATUSES } from '@/lib/utils';
import type { PromoStatus } from '@/lib/types';

export function Pipeline({ status }: { status: PromoStatus }) {
  const pipeIdx = PIPELINE_STATUSES.indexOf(status);
  const special = pipeIdx === -1;
  return (
    <div className="flex items-center overflow-x-auto py-1.5">
      {PIPELINE_STATUSES.map((s, i) => {
        const done = !special && i < pipeIdx;
        const current = !special && i === pipeIdx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5 min-w-[84px]">
              <div
                className="w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center text-[11px] font-bold"
                style={{
                  borderColor: done || current ? (done ? 'rgb(var(--teal))' : 'rgb(var(--red))') : 'rgb(var(--border))',
                  background: done ? 'rgb(var(--teal))' : current ? 'rgb(var(--red))' : 'rgb(var(--surface))',
                  color: done || current ? '#fff' : 'rgb(var(--text-faint))',
                  boxShadow: current ? '0 0 0 4px rgb(var(--red-soft))' : 'none',
                }}
              >
                {done ? <Icon name="check" size={12} /> : i + 1}
              </div>
              <div
                className="text-[10.5px] font-semibold whitespace-nowrap"
                style={{ color: done ? 'rgb(var(--teal))' : current ? 'rgb(var(--red))' : 'rgb(var(--text-faint))' }}
              >
                {s}
              </div>
            </div>
            {i < PIPELINE_STATUSES.length - 1 && (
              <div className="flex-1 h-0.5 min-w-5 mt-[-13px]" style={{ background: done ? 'rgb(var(--teal))' : current ? 'rgb(var(--red))' : 'rgb(var(--border))' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}