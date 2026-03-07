-- Clean sports false positives from executive_moves
-- "Caio" / "Rodrigo Caio" are soccer players, not Chief AI Officers
DELETE FROM executive_moves
WHERE headline ILIKE '%rodrigo caio%'
   OR headline ILIKE '%flamengo%'
   OR headline ILIKE '%defender%'
   OR headline ILIKE '%midfielder%'
   OR headline ILIKE '%striker%'
   OR headline ILIKE '%goalkeeper%'
   OR headline ILIKE '%footballer%'
   OR headline ILIKE '%soccer%'
   OR headline ILIKE '%technical committee%'
   OR headline ILIKE '%mma%'
   OR headline ILIKE '%ufc%'
   OR headline ILIKE '%fighter%'
   OR headline ILIKE '%boxing%'
   OR headline ILIKE '%wrestling%';
