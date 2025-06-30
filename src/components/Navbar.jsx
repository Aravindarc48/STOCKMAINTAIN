import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import StoreIcon from '@mui/icons-material/Store';

const Navbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        
        <Box display="flex" alignItems="center" gap={1}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onMenuClick}>
              <MenuIcon />
            </IconButton>
          )}
          <StoreIcon sx={{ fontSize: 40 }} />
          <Typography
            variant="h6"
            fontWeight={700}
            noWrap
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            ARK SUPPLIES & DISTRIBUTION
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" fontWeight={500}>
            Admin
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
