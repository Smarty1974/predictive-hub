import { useMemo } from 'react';
import { Eye, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dataset,
  DataTransformation,
  TransformFunctionType,
  SelectedDatasetConfig,
} from '@/types/dataset';
import { cn } from '@/lib/utils';

interface TransformationPreviewProps {
  dataset: Dataset;
  config: SelectedDatasetConfig;
  newTransformation?: Partial<DataTransformation>;
}

// Simulate transformation results on preview data
function applyTransformation(
  row: Record<string, unknown>,
  transformation: DataTransformation | Partial<DataTransformation>
): unknown {
  const { functionType, sourceColumns = [], parameters = {} } = transformation;
  
  if (!functionType || sourceColumns.length === 0) return null;
  
  const sourceValue = row[sourceColumns[0]];
  
  switch (functionType) {
    case 'IF_MISSING':
    case 'FILL_NA': {
      const fillValue = parameters.fillValue ?? parameters.defaultValue ?? 'N/A';
      return sourceValue == null || sourceValue === '' ? fillValue : sourceValue;
    }
    case 'UPPERCASE':
      return typeof sourceValue === 'string' ? sourceValue.toUpperCase() : sourceValue;
    case 'LOWERCASE':
      return typeof sourceValue === 'string' ? sourceValue.toLowerCase() : sourceValue;
    case 'TRIM':
      return typeof sourceValue === 'string' ? sourceValue.trim() : sourceValue;
    case 'ROUND': {
      const decimals = Number(parameters.decimals) || 0;
      return typeof sourceValue === 'number' ? Number(sourceValue.toFixed(decimals)) : sourceValue;
    }
    case 'ABS':
      return typeof sourceValue === 'number' ? Math.abs(sourceValue) : sourceValue;
    case 'LOG':
      return typeof sourceValue === 'number' && sourceValue > 0 ? Math.log(sourceValue).toFixed(4) : 'N/A';
    case 'SQRT':
      return typeof sourceValue === 'number' && sourceValue >= 0 ? Math.sqrt(sourceValue).toFixed(4) : 'N/A';
    case 'NORMALIZE': {
      // Simple 0-1 normalization simulation
      return typeof sourceValue === 'number' ? ((sourceValue % 100) / 100).toFixed(4) : sourceValue;
    }
    case 'SCALE': {
      // Z-score simulation
      return typeof sourceValue === 'number' ? ((sourceValue - 50) / 25).toFixed(4) : sourceValue;
    }
    case 'CONCAT': {
      if (sourceColumns.length > 1) {
        const separator = typeof parameters.separator === 'string' ? parameters.separator : ' ';
        return sourceColumns.map(col => String(row[col] ?? '')).join(separator);
      }
      return sourceValue;
    }
    case 'SUBSTRING': {
      const start = Number(parameters.start) || 0;
      const length = Number(parameters.length) || 10;
      return typeof sourceValue === 'string' ? sourceValue.substring(start, start + length) : sourceValue;
    }
    case 'REPLACE': {
      const pattern = String(parameters.pattern || '');
      const replacement = String(parameters.replacement || '');
      return typeof sourceValue === 'string' ? sourceValue.replace(pattern, replacement) : sourceValue;
    }
    case 'DATE_FORMAT': {
      if (sourceValue instanceof Date || typeof sourceValue === 'string') {
        try {
          const date = new Date(String(sourceValue));
          return date.toLocaleDateString('it-IT');
        } catch {
          return sourceValue;
        }
      }
      return sourceValue;
    }
    case 'SUM':
    case 'AVG':
    case 'COUNT':
    case 'MIN':
    case 'MAX':
      // Aggregate functions - show placeholder
      return `[${functionType}]`;
    default:
      return sourceValue;
  }
}

export function TransformationPreview({
  dataset,
  config,
  newTransformation,
}: TransformationPreviewProps) {
  const previewRows = dataset.preview || [];
  const allTransformations = config.transformations;
  
  // Calculate transformed data
  const transformedData = useMemo(() => {
    if (!previewRows.length) return [];
    
    return previewRows.map((row, rowIndex) => {
      const transformedRow: Record<string, { original: unknown; transformed: unknown; isNew: boolean }> = {};
      
      // Original columns
      Object.keys(row).forEach(col => {
        transformedRow[col] = {
          original: row[col],
          transformed: row[col],
          isNew: false,
        };
      });
      
      // Apply existing transformations
      allTransformations.forEach(transform => {
        const result = applyTransformation(row, transform);
        transformedRow[transform.columnName] = {
          original: null,
          transformed: result,
          isNew: true,
        };
      });
      
      // Apply new transformation (preview)
      if (newTransformation?.columnName && newTransformation?.functionType) {
        const result = applyTransformation(row, newTransformation as DataTransformation);
        transformedRow[newTransformation.columnName] = {
          original: null,
          transformed: result,
          isNew: true,
        };
      }
      
      return transformedRow;
    });
  }, [previewRows, allTransformations, newTransformation]);
  
  // Get all column names including new ones
  const allColumns = useMemo(() => {
    const cols = new Set<string>();
    
    // Original columns (limited to selected)
    config.selectedColumns.slice(0, 4).forEach(col => cols.add(col));
    
    // Transformation columns
    allTransformations.forEach(t => cols.add(t.columnName));
    
    // New transformation column
    if (newTransformation?.columnName) {
      cols.add(newTransformation.columnName);
    }
    
    return Array.from(cols);
  }, [config.selectedColumns, allTransformations, newTransformation]);
  
  const hasNewTransform = newTransformation?.columnName && newTransformation?.functionType;
  
  if (!previewRows.length) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nessuna anteprima disponibile per questo dataset</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Anteprima Live Trasformazioni</span>
        </div>
        <div className="flex items-center gap-2">
          {hasNewTransform && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Nuova colonna in preview
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {previewRows.length} righe
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[200px] rounded-lg border border-border">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              {allColumns.map((col) => {
                const isNewColumn = allTransformations.some(t => t.columnName === col) || 
                  (newTransformation?.columnName === col);
                const isCurrentNewColumn = newTransformation?.columnName === col;
                
                return (
                  <TableHead 
                    key={col} 
                    className={cn(
                      "min-w-[120px]",
                      isNewColumn && "bg-primary/5",
                      isCurrentNewColumn && "bg-primary/10 text-primary"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {isNewColumn && <Sparkles className="w-3 h-3" />}
                      <span className="truncate">{col}</span>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transformedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {rowIndex + 1}
                </TableCell>
                {allColumns.map((col) => {
                  const cellData = row[col];
                  const isNewColumn = cellData?.isNew;
                  const isCurrentNewColumn = newTransformation?.columnName === col;
                  const value = cellData?.transformed;
                  
                  return (
                    <TableCell 
                      key={col}
                      className={cn(
                        "font-mono text-sm",
                        isNewColumn && "bg-primary/5",
                        isCurrentNewColumn && "bg-primary/10 font-medium text-primary"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {isCurrentNewColumn && value !== null && value !== undefined && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[150px]">
                          {value != null ? String(value) : <span className="text-muted-foreground">null</span>}
                        </span>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {hasNewTransform && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>
            La colonna <code className="px-1 py-0.5 rounded bg-primary/10 text-primary font-mono">
              {newTransformation?.columnName}
            </code> verrà creata usando <strong>{newTransformation?.functionType}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
