# H-Beam STEP Files

This repository contains standards-compliant STEP files (.step/.stp) modeling a symmetrical H-beam with precise specifications.

## Beam Specifications

- **Length (X direction)**: 18 cm (180 mm)
- **Total Height (Y direction)**: 7 mm
- **Total Width (Z direction)**: 2 cm (20 mm)
- **Flange Thickness**: 2 mm (both top and bottom flanges)
- **Web Thickness**: 2 mm
- **Position**: Centered at origin (0,0,0) in 3D space

## Files Included

### 1. `Hbeam.step` (Advanced)
- Complex STEP file with explicit geometric definitions
- Contains detailed vertex, edge, and face topology
- Defines front face, back face, and connecting edges
- Uses advanced BREP (Boundary Representation) modeling
- More suitable for advanced CAD analysis

### 2. `Hbeam_simple.step` (Recommended)
- Simplified but robust STEP file
- Uses extruded area solid approach
- Better compatibility across different CAD software
- Cleaner structure with fewer geometric entities
- Recommended for general use

## Technical Details

### Units
- All dimensions are in **millimeters**
- Consistent SI units throughout the file
- Precision: 1E-07 mm accuracy

### Coordinate System
- **X-axis**: Length direction (180 mm)
- **Y-axis**: Height direction (7 mm) 
- **Z-axis**: Width direction (20 mm)
- Origin at (0,0,0) with beam centered

### H-Beam Cross-Section Geometry
The H-beam profile consists of:
- **Top Flange**: 20mm wide × 2mm thick (Y: 1.5 to 3.5mm)
- **Bottom Flange**: 20mm wide × 2mm thick (Y: -3.5 to -1.5mm)
- **Web**: 2mm thick × 3mm high (Z: -1 to 1mm, Y: -1.5 to 1.5mm)

### Key Points (Cross-Section)
```
(-10, 3.5) ┌─────────────────┐ (10, 3.5)    ← Top flange
           │                 │
(-10, 1.5) └──┐           ┌──┘ (10, 1.5)
              │           │                  ← Web connection
 (-1, 1.5)    │    WEB    │    (1, 1.5)
              │           │
 (-1,-1.5)    │           │    (1,-1.5)
(-10,-1.5) ┌──┘           └──┐ (10,-1.5)
           │                 │
(-10,-3.5) └─────────────────┘ (10,-3.5)    ← Bottom flange
```

## STEP File Compliance

Both files conform to:
- **ISO 10303-21** (STEP Part 21 standard)
- **AUTOMOTIVE_DESIGN** schema
- Standard CAD software compatibility:
  - AutoCAD Mechanical
  - SolidWorks
  - Fusion 360
  - FreeCAD
  - OnShape
  - CATIA

## Usage

1. **Import into CAD software**: Use File → Import → STEP (.step/.stp)
2. **Verification**: Check dimensions match specifications
3. **Analysis**: Suitable for FEA, stress analysis, and structural calculations
4. **Manufacturing**: Ready for CNC machining or 3D printing

## File Structure

Each STEP file contains:
```
ISO-10303-21;
HEADER;
  FILE_DESCRIPTION(...)
  FILE_NAME(...)
  FILE_SCHEMA(...)
ENDSEC;
DATA;
  /* Geometric entities and topology */
ENDSEC;
END-ISO-10303-21;
```

## Validation

The STEP files have been created with:
- ✅ Proper header metadata
- ✅ Consistent units declaration
- ✅ Valid geometric entities
- ✅ Closed topology (manifold solid)
- ✅ Standard-compliant syntax

## Troubleshooting

If you encounter import issues:
1. Try the simplified version (`Hbeam_simple.step`) first
2. Ensure your CAD software supports STEP format
3. Check that units are correctly interpreted as millimeters
4. Verify the beam appears centered at the origin

## License

These files are provided as engineering examples and may be used freely for educational and commercial purposes. 