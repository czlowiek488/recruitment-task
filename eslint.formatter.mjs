import stylish from 'eslint-formatter-stylish';

export default function format(results) {
  const originalOutput = stylish(results);
  return originalOutput.replaceAll("/app/", "/")
}
