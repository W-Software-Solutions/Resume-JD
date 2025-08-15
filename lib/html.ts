export function htmlToPlainText(html: string): string {
  if (!html) return '';
  try {
    // replace block tags with newlines first
    const blockTags = ['p', 'div', 'section', 'br', 'li', 'ul', 'ol', 'h1','h2','h3','h4','h5','h6'];
    let t = html;
    blockTags.forEach(tag => {
      const re1 = new RegExp(`<${tag}[^>]*>`, 'gi');
      const re2 = new RegExp(`</${tag}>`, 'gi');
      t = t.replace(re1, '\n').replace(re2, '\n');
    });
    // strip remaining tags
    t = t.replace(/<style[\s\S]*?<\/style>/gi, '')
         .replace(/<script[\s\S]*?<\/script>/gi, '')
         .replace(/<[^>]+>/g, '')
         .replace(/\n{3,}/g, '\n\n')
         .replace(/\s+$/gm, '')
         .trim();
    return t;
  } catch {
    return html;
  }
}

export function plainTextToHtml(text: string): string {
  if (!text) return '';
  try {
    // Normalize line endings
    const t = text.replace(/\r\n/g, '\n');
    const parts = t
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(p => {
        // convert single newlines in a paragraph to <br/>
        const lines = p.split('\n').map(l => l.trim()).join('<br/>');
        return `<p>${lines}</p>`;
      });
    return parts.join('\n');
  } catch {
    return `<pre>${text}</pre>`;
  }
}
