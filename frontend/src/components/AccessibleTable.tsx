import React from 'react';

type Col<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  id: string;
  caption: string;
  columns: Col<T>[];
  data: T[];
};

export function AccessibleTable<T extends Record<string, any>>({ id, caption, columns, data }: Props<T>) {
  return (
    <div role="region" aria-labelledby={id + '-caption'} tabIndex={0}>
      <table aria-describedby={id + '-caption'} role="table">
        <caption id={id + '-caption'}>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => (
              <th role="columnheader" key={String(c.key)} scope="col" tabIndex={-1}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {data.map((row, i) => (
            <tr role="row" key={i}>
              {columns.map((c) => (
                <td role="cell" key={String(c.key)}>{c.render ? c.render(row) : String(row[c.key as keyof T] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
