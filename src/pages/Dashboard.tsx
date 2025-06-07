import { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Button, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Budget {
  id: string;
  title: string;
  created_at: string;
  total_value: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    navigate('/budget-editor');
  };

  const handleOpenBudget = (id: string) => {
    navigate(`/budget-editor/${id}`);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Bem-vindo ao Sistema de Orçamentos
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              size="large"
              fullWidth
              sx={{ mb: 2 }}
              onClick={handleCreateBudget}
            >
              Criar Novo Orçamento
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Orçamentos Recentes
            </Typography>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <CircularProgress />
              </div>
            ) : budgets.length === 0 ? (
              <Typography color="textSecondary" align="center">
                Nenhum orçamento encontrado
              </Typography>
            ) : (
              <List>
                {budgets.map((budget) => (
                  <ListItem
                    key={budget.id}
                    button
                    onClick={() => handleOpenBudget(budget.id)}
                    divider
                  >
                    <ListItemText
                      primary={budget.title}
                      secondary={`Criado em: ${new Date(budget.created_at).toLocaleDateString('pt-BR')} - Valor Total: ${budget.total_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}