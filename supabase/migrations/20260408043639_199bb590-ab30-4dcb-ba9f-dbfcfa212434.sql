
-- FCM device tokens
CREATE TABLE public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tokens" ON public.fcm_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tokens" ON public.fcm_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete tokens" ON public.fcm_tokens FOR DELETE USING (true);

-- Scheduled tasks for backend notification delivery
CREATE TABLE public.scheduled_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scheduled_time BIGINT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tasks" ON public.scheduled_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.scheduled_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.scheduled_tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.scheduled_tasks FOR DELETE USING (true);
