-- Funciones de constraint triggers: nadie las llama por RPC
revoke execute on function public.require_elderly_tag_on_post() from public, anon, authenticated;
revoke execute on function public.keep_one_elderly_tag_on_post() from public, anon, authenticated;
