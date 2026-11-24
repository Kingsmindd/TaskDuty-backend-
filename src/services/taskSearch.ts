export class SearchSyntaxError extends Error {}
function literal(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
export function buildTaskSearch(search: string): Record<string, unknown>[] {
  const tokens = search.match(/-?(?:[a-z]+:)?(?:"[^"]*"|\S+)/gi) || [];
  return tokens.map(raw => {
    const negative = raw.startsWith('-') && raw.length > 1;
    const token = negative ? raw.slice(1) : raw;
    const match = /^(is|tag|before|after|title|description):(.*)$/i.exec(token);
    const key = match?.[1]?.toLowerCase();
    let value = match ? match[2]! : token;
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) value = value.slice(1, -1);
    else if (value.includes('"')) throw new SearchSyntaxError('Close each quoted phrase with a quotation mark.');
    if (!value.trim()) throw new SearchSyntaxError('Add a value after ' + (key || 'the search operator') + ':');
    let clause: Record<string, unknown>;
    if (key === 'is') {
      if (!['pending', 'completed'].includes(value.toLowerCase())) throw new SearchSyntaxError('Use is:pending or is:completed.');
      clause = {completed: value.toLowerCase() === 'completed'};
    } else if (key === 'tag') {
      const category = {urgent: 'Urgent', important: 'Important'}[value.toLowerCase()];
      if (!category) throw new SearchSyntaxError('Use tag:urgent or tag:important.');
      clause = {category};
    } else if (key === 'before' || key === 'after') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new SearchSyntaxError('Use a valid date, for example before:2026-12-31.');
      clause = {dueDate: {$exists: true, $ne: '', [key === 'before' ? '$lt' : '$gt']: value}};
    } else {
      const regex = {$regex: literal(value), $options: 'i'};
      clause = key ? {[key]: regex} : {$or: [{title: regex}, {description: regex}]};
    }
    return negative ? {$nor: [clause]} : clause;
  });
}
