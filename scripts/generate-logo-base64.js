const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'VBS.png');
const outputPath = path.join(__dirname, '..', 'src', 'components', 'pdf', 'logo-base64.ts');

const img = fs.readFileSync(imgPath);
const b64 = img.toString('base64');

const content = `// Logo VBS.png em Base64 para uso em @react-pdf/renderer
// Gerado automaticamente - NÃO EDITAR MANUALMENTE
export const VBS_LOGO_BASE64 = 'data:image/png;base64,${b64}';
`;

fs.writeFileSync(outputPath, content);
console.log('Logo base64 gerado com sucesso!');
console.log('Tamanho do base64:', b64.length, 'caracteres');
