alter type public.credit_allocation_origin
    add value if not exists 'legacy_unclassified';

alter type public.credit_allocation_movement_type
    add value if not exists 'opening_balance';
