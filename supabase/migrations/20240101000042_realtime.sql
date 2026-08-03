-- Realtime publication is limited to public tables whose rows are filtered by RLS.
ALTER PUBLICATION supabase_realtime ADD TABLE api.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE api.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE api.platform_state;

-- Private tables must never be added to this publication.
