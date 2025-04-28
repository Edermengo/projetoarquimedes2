import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search as SearchIcon, Upload as UploadIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

interface PriceItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  price: number;
  source: string;
  reference_date: string;
}

export default function PriceDatabase() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPriceData = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('price_database')
        .select('*')
        .order('code');

      if (search) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setItems(data || []);
    } catch (err) {
      setError('Erro ao carregar dados. Por favor, tente novamente.');
      console.error('Error loading price data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriceData();
  }, []);

  const handleSearch = () => {
    loadPriceData(searchTerm);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        const items = lines.slice(1).map((line) => {
          const values = line.split(',');
          return {
            code: values[0],
            description: values[1],
            unit: values[2],
            price: parseFloat(values[3]),
            source: values[4],
            reference_date: values[5]
          };
        });

        const { error } = await supabase
          .from('price_database')
          .insert(items);

        if (error) throw error;

        setSuccess('Dados importados com sucesso!');
        loadPriceData();
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Erro ao importar dados. Verifique o formato do arquivo.');
      console.error('Error importing data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Banco de Preços
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Pesquisar"
            placeholder="Digite um código ou descrição"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            Buscar
          </Button>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
            disabled={loading}
          >
            Importar CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Unidade</TableCell>
              <TableCell align="right">Preço</TableCell>
              <TableCell>Fonte</TableCell>
              <TableCell>Data Ref.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    {searchTerm ? 'Nenhum resultado encontrado' : 'Use a busca para encontrar itens'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="right">
                    {item.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>
                    {new Date(item.reference_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}