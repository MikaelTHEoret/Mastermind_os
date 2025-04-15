import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
import matplotlib.pyplot as plt

# Setup parameters
MaRadius = 1
MiRadius = 1
PhiFlux = 1
ToMag = 1
MagConst = 1
Paxi = 1
Baxi = 1

# Grid parameters
nr = 50  # Number of grid points in r
nz = 50  # Number of grid points in z
r_max = 3.0
z_max = 3.0
dr = r_max / (nr - 1)
dz = z_max / (nz - 1)

# Create grid
r = np.linspace(dr, r_max-dr, nr-2)  # Interior points only
z = np.linspace(dz, z_max-dz, nz-2)  # Interior points only

def setup_GS_system(r, z):
    """Setup the linear system for the Grad-Shafranov equation."""
    nr_interior = len(r)
    nz_interior = len(z)
    n_total = nr_interior * nz_interior
    
    # Create sparse matrix for left-hand side
    row_indices = []
    col_indices = []
    values = []
    
    # Create right-hand side vector
    b = np.zeros(n_total)
    
    # Fill matrices
    for i in range(nz_interior):
        for j in range(nr_interior):
            # Current node index
            node = i * nr_interior + j
            r_val = r[j]
            
            # Right-hand side source terms (using Guazzotto & Freidberg model)
            b[node] = -2 * MagConst * r_val**2 * Paxi - (MaRadius * ToMag)**2 * Baxi
            
            # Coefficient for current node
            row_indices.append(node)
            col_indices.append(node)
            values.append(-2/dr**2 - 2/dz**2)
            
            # r+1 neighbor
            if j < nr_interior - 1:
                row_indices.append(node)
                col_indices.append(node + 1)
                values.append(1/dr**2 + 1/(2*dr*r_val))
            
            # r-1 neighbor
            if j > 0:
                row_indices.append(node)
                col_indices.append(node - 1)
                values.append(1/dr**2 - 1/(2*dr*r_val))
            
            # z+1 neighbor
            if i < nz_interior - 1:
                row_indices.append(node)
                col_indices.append(node + nr_interior)
                values.append(1/dz**2)
            
            # z-1 neighbor
            if i > 0:
                row_indices.append(node)
                col_indices.append(node - nr_interior)
                values.append(1/dz**2)
    
    # Create sparse matrix
    A = sp.csr_matrix((values, (row_indices, col_indices)), shape=(n_total, n_total))
    
    # Scale the right-hand side
    b = b / (PhiFlux**2)
    
    return A, b

def solve_GS_equation(r, z):
    """Solve the Grad-Shafranov equation with zero boundary conditions."""
    A, b = setup_GS_system(r, z)
    
    # Solve the linear system
    psi_interior = spsolve(A, b)
    
    # Reshape to 2D grid (interior points)
    psi_interior_2d = psi_interior.reshape((len(z), len(r)))
    
    # Create full grid including boundary
    psi = np.zeros((len(z)+2, len(r)+2))
    psi[1:-1, 1:-1] = psi_interior_2d
    
    # Return both the solution and the full grid coordinates
    r_full = np.concatenate(([0], r, [r_max]))
    z_full = np.concatenate(([0], z, [z_max]))
    
    return psi, r_full, z_full

# Solve the equation
psi, r_grid, z_grid = solve_GS_equation(r, z)

# Plot the solution
plt.figure(figsize=(10, 8))
r_mesh, z_mesh = np.meshgrid(r_grid, z_grid)
plt.contour(r_mesh, z_mesh, psi, 20)
plt.colorbar(label='Flux $\\psi$')
plt.xlabel('r')
plt.ylabel('z')
plt.title('Flux surfaces from Grad-Shafranov solution')
plt.axis('equal')
plt.tight_layout()
plt.show()