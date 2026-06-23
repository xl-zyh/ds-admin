import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { OperationLogService } from '../../modules/operation-log/operation-log.service';

/**
 * 操作日志拦截器 — 自动记录 POST / PUT / DELETE 操作
 *
 * 记录内容：
 * - 操作人用户名、昵称、角色名
 * - 操作类型（CREATE / UPDATE / DELETE）
 * - 目标资源（从 URL 路径提取）
 * - 操作详情：格式为"模块名/操作类型/实体名"
 * - 请求 IP
 */
@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private logService: OperationLogService) {}

  private static readonly ACTION_MAP: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  private static readonly ACTION_LABEL: Record<string, string> = {
    CREATE: '新增',
    UPDATE: '修改',
    DELETE: '删除',
  };

  private static readonly RESOURCE_MAP: Record<string, string> = {
    users: '用户管理',
    roles: '角色管理',
    'qr-checkin': '二维码签到',
    'flow-summary': '客流明细',
    'operation-logs': '操作日志',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();
    const action = LogInterceptor.ACTION_MAP[method];

    if (!action) return next.handle();

    const user = request.user;
    const resource = this.extractResource(request.path);
    const actionLabel = LogInterceptor.ACTION_LABEL[action] || action;
    const entityName = this.extractEntityName(request);
    const detail = entityName ? `${resource}/${actionLabel}/${entityName}` : `${resource}/${actionLabel}`;

    return next.handle().pipe(
      tap(() => {
        this.logService.save({
          username: user?.username || 'unknown',
          nickname: user?.nickname || null,
          roleName: user?.roleName || null,
          action,
          resource,
          detail,
          ip: request.ip || request.headers['x-forwarded-for'] || null,
        }).catch(() => {
          // 日志记录失败不影响主流程
        });
      }),
    );
  }

  /** 从 URL 路径提取资源名 */
  private extractResource(path: string): string {
    const prefix = path.replace(/^\/api\//, '').split('/')[0];
    return LogInterceptor.RESOURCE_MAP[prefix] || prefix;
  }

  /** 从请求中提取操作的实体名 */
  private extractEntityName(request: any): string {
    const body = request.body;
    if (!body) return '';

    // POST/PUT 请求体中的名称字段
    return body.name || body.nickname || body.username || '';
  }
}