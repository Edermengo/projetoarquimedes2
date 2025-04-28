import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

interface Chapter {
  id: string;
  code: string;
  title: string;
  services: Service[];
}

interface Service {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface NewService {
  code: string;
  description: string;
  unit: string;
  quantity: string;
  unit_price: string;
}

export default function BudgetEditor() {
  const navigate = useNavigate();
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [bdi, setBdi] = useState('0');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [openChapterDialog, setOpenChapterDialog] = useState(false);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [newChapter, setNewChapter] = useState({ code: '', title: '' });
  const [newService, setNewService] = useState<NewService>({
    code: '',
    description: '',
    unit: '',
    quantity: '0',
    unit_price: '0'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      navigate('/login');
    }
  };

  const handleAddChapter = async () => {
    try {
      if (!budgetId) {
        // Create budget first if it doesn't exist
        const budget = await handleSaveBudget();
        if (!budget) {
          throw new Error('Failed to create budget');
        }
      }

      const { data, error } = await supabase
        .from('chapters')
        .insert({
          code: newChapter.code,
          title: newChapter.title,
          sequence: chapters.length + 1,
          budget_id: budgetId
        })
        .select()
        .single();

      if (error) throw error;

      setChapters([...chapters, { ...data, services: [] }]);
      setOpenChapterDialog(false);
      setNewChapter({ code: '', title: '' });
      setError(null);
    } catch (error: any) {
      console.error('Erro ao adicionar capítulo:', error);
      setError(error.message);
    }
  };

  const handleAddService = async () => {
    if (!selectedChapter) return;

    try {
      const quantity = parseFloat(newService.quantity);
      const unit_price = parseFloat(newService.unit_price);
      const total_price = quantity * unit_price;

      const { data, error } = await supabase
        .from('services')
        .insert({
          chapter_id: selectedChapter,
          code: newService.code,
          description: newService.description,
          unit: newService.unit,
          quantity,
          unit_price,
          total_price
        })
        .select()
        .single();

      if (error) throw error;

      setChapters(chapters.map(chapter => {
        if (chapter.id === selectedChapter) {
          return {
            ...chapter,
            services: [...chapter.services, data]
          };
        }
        return chapter;
      }));

      setOpenServiceDialog(false);
      setNewService({
        code: '',
        description: '',
        unit: '',
        quantity: '0',
        unit_price: '0'
      });
      setError(null);
    } catch (error: any) {
      console.error('Erro ao adicionar serviço:', error);
      setError(error.message);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return null;
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          title: budgetTitle,
          description: budgetDescription,
          bdi: parseFloat(bdi),
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      setBudgetId(data.id);
      setError(null);
      return data;
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      setError(error.message);
      return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Editor de Orçamento
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Título do Orçamento"
              value={budgetTitle}
              onChange={(e) => setBudgetTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="BDI (%)"
              type="number"
              value={bdi}
              onChange={(e) => setBdi(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descrição"
              value={budgetDescription}
              onChange={(e) => setBudgetDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveBudget}
              disabled={!budgetTitle}
            >
              Salvar Orçamento
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Capítulos e Serviços</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenChapterDialog(true)}
            disabled={!budgetId}
          >
            Adicionar Capítulo
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Unidade</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chapters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      {!budgetId 
                        ? 'Salve o orçamento primeiro para adicionar capítulos'
                        : 'Nenhum item adicionado'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                chapters.map((chapter) => (
                  <>
                    <TableRow key={chapter.id} sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell colSpan={6}>
                        <Typography variant="subtitle1">
                          {chapter.code} - {chapter.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedChapter(chapter.id);
                            setOpenServiceDialog(true);
                          }}
                        >
                          Serviço
                        </Button>
                      </TableCell>
                    </TableRow>
                    {chapter.services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.code}</TableCell>
                        <TableCell>{service.description}</TableCell>
                        <TableCell>{service.unit}</TableCell>
                        <TableCell align="right">{service.quantity}</TableCell>
                        <TableCell align="right">
                          {service.unit_price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {service.total_price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo para adicionar capítulo */}
      <Dialog open={openChapterDialog} onClose={() => setOpenChapterDialog(false)}>
        <DialogTitle>Adicionar Novo Capítulo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código do Capítulo"
                value={newChapter.code}
                onChange={(e) => setNewChapter({ ...newChapter, code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título do Capítulo"
                value={newChapter.title}
                onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChapterDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddChapter} 
            variant="contained"
            disabled={!newChapter.code || !newChapter.title}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para adicionar serviço */}
      <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)}>
        <DialogTitle>Adicionar Novo Serviço</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código do Serviço"
                value={newService.code}
                onChange={(e) => setNewService({ ...newService, code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição do Serviço"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unidade"
                value={newService.unit}
                onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                value={newService.quantity}
                onChange={(e) => setNewService({ ...newService, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Preço Unitário"
                value={newService.unit_price}
                onChange={(e) => setNewService({ ...newService, unit_price: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenServiceDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddService} 
            variant="contained"
            disabled={!newService.code || !newService.description || !newService.unit}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}