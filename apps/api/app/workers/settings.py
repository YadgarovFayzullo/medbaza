"""arq worker configuration.

Run with: `arq app.workers.settings.WorkerSettings`
"""

from typing import Any

from arq.connections import RedisSettings
from arq.cron import cron

from app.core.config import settings
from app.core.logging import configure_logging
from app.workers.tasks.email import send_order_confirmation, send_prescription_decision
from app.workers.tasks.outbox import dispatch_outbox


async def startup(ctx: dict[str, Any]) -> None:
    configure_logging(settings.log_level)


class WorkerSettings:
    functions = [send_order_confirmation, send_prescription_decision]
    cron_jobs = [cron(dispatch_outbox, second={0, 10, 20, 30, 40, 50}, run_at_startup=True)]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    on_startup = startup
    # Every job declares its retry budget; exhausted jobs are logged and kept.
    max_tries = 5
    job_timeout = 60
