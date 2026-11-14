<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Fixed sample tasks. Alice and Bob both have a task titled "Prepare monthly
 * report" so it is easy to verify that search never returns another user's tasks.
 */
class TaskSeeder extends Seeder
{
    private const TASKS = [
        'admin@example.com' => [
            ['Review new user registrations', 'Check the latest sign-ups for anything unusual.', 'Pending', 'Medium', 3],
            ['Plan database backup schedule', 'Decide frequency and retention for mysqldump backups.', 'In Progress', 'High', 7],
            ['Update README for reviewers', null, 'Completed', 'Low', null],
        ],
        'alice@example.com' => [
            ['Prepare monthly report', 'Summarise October sales figures for the team meeting.', 'In Progress', 'High', 2],
            ['Book conference room', 'Room for Friday sprint review, 10 people.', 'Pending', 'Low', 5],
            ['Fix login page typo', 'The word "password" is misspelled on the login form.', 'Completed', 'Medium', null],
            ['Write unit tests for invoices', 'Cover tax calculation and rounding edge cases.', 'Pending', 'High', 10],
            ['Reply to client email', 'Client asked about the delivery timeline.', 'Pending', 'Medium', 1],
            ['Update project documentation', null, 'In Progress', 'Low', 14],
            ['Clean up old feature branches', 'Delete merged branches older than 3 months.', 'Completed', 'Low', null],
            ['Research charting libraries', 'Compare options for the dashboard redesign.', 'Pending', 'Medium', null],
        ],
        'bob@example.com' => [
            ['Prepare monthly report', 'Operations report: uptime and incident summary.', 'Pending', 'High', 4],
            ['Renew SSL certificate', 'Certificate for the staging server expires soon.', 'In Progress', 'High', 3],
            ['Order new keyboards', 'Two keyboards for the support team.', 'Completed', 'Low', null],
            ['Organise team lunch', 'Collect dietary preferences first.', 'Pending', 'Low', 12],
            ['Migrate cron jobs', 'Move scheduled jobs from the old server.', 'In Progress', 'Medium', 9],
            ['Audit user permissions', 'Make sure former employees no longer have access.', 'Pending', 'High', 6],
            ['Archive 2025 tickets', null, 'Completed', 'Medium', null],
            ['Set up monitoring alerts', 'Alert on disk usage above 80%.', 'Pending', 'Medium', 15],
        ],
    ];

    public function run(): void
    {
        foreach (self::TASKS as $email => $tasks) {
            $user = User::where('email', $email)->firstOrFail();
            if ($user->tasks()->exists()) {
                continue;
            }

            foreach ($tasks as [$title, $description, $status, $priority, $dueInDays]) {
                $user->tasks()->create([
                    'title' => $title,
                    'description' => $description,
                    'status' => $status,
                    'priority' => $priority,
                    'due_date' => $dueInDays === null ? null : now()->addDays($dueInDays)->toDateString(),
                ]);
            }
        }
    }
}
